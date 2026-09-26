#!/usr/bin/env bash
# Recovery drill 1 (docs/RESILIENCE.md): kill a worker in the middle of a large CSV import and
# check that a new worker resumes it and every row becomes exactly one listing.
# Runs entirely in the isolated test stack (project "motorx-test"); the dev stack is untouched.
#   bash scripts/drills/kill-worker-mid-import.sh [records]
set -euo pipefail
RECORDS="${1:-60000}"
COMPOSE="docker compose -f compose.yml -f compose.test.yml"
MONGO="$COMPOSE exec -T mongodb mongosh --quiet motorx_test --eval"
cleanup() { docker rm -f drill-worker-1 drill-worker-2 >/dev/null 2>&1 || true; $COMPOSE down -v >/dev/null 2>&1 || true; }
trap cleanup EXIT

echo "1. Starting MongoDB, Redis and storage"
$COMPOSE up -d mongodb mongodb-init redis minio minio-init >/dev/null 2>&1
$COMPOSE build worker >/dev/null

echo "2. Queuing a ${RECORDS}-row CSV import"
JOB=$($COMPOSE run --rm -T worker npx tsx src/drills/seedImport.ts "$RECORDS" 2>/dev/null | sed -n 's/^UPLOAD_JOB_ID=//p' | tr -d '\r')
[ -n "$JOB" ] || { echo "Could not create the upload job"; exit 1; }
echo "   upload job $JOB"
progress() { $MONGO "const j=db.uploadJobs.findOne({_id:ObjectId('$JOB')}); print(j.status+' '+j.processedRecords+' '+j.attemptCount)" | tr -d '\r'; }

echo "3. Starting worker 1 and killing it mid-import"
$COMPOSE run -d --name drill-worker-1 -e JOB_REAPER_INTERVAL_MS=5000 -e MAX_LISTINGS_PER_DEALER=1000000 worker npx tsx src/worker.ts >/dev/null
for _ in $(seq 1 120); do
  read -r STATUS DONE _ <<<"$(progress)"
  if [ "$STATUS" = "processing" ] && [ "${DONE:-0}" -gt $((RECORDS / 10)) ]; then break; fi
  sleep 1
done
docker kill drill-worker-1 >/dev/null
read -r STATUS DONE ATTEMPTS <<<"$(progress)"
echo "   killed at $DONE/$RECORDS rows (status: $STATUS)"
[ "$STATUS" = "processing" ] || { echo "Worker finished before it could be killed; use more records"; exit 1; }

echo "4. Starting worker 2 (it takes over once the dead worker's 2-minute lease expires)"
STARTED=$(date +%s)
$COMPOSE run -d --name drill-worker-2 -e JOB_REAPER_INTERVAL_MS=5000 -e MAX_LISTINGS_PER_DEALER=1000000 worker npx tsx src/worker.ts >/dev/null
for _ in $(seq 1 400); do
  read -r STATUS DONE ATTEMPTS <<<"$(progress)"
  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then break; fi
  sleep 1
done
echo "   status: $STATUS after $(( $(date +%s) - STARTED )) s, attempts: $ATTEMPTS"

echo "5. Checking the result"
RESULT=$($MONGO "const id=ObjectId('$JOB'); const j=db.uploadJobs.findOne({_id:id}); const n=db.listings.countDocuments({sourceUploadJobId:id}); const d=db.listings.distinct('sourceRowNumber',{sourceUploadJobId:id}).length; print(j.status+' '+j.validRecords+' '+j.rejectedRecords+' '+n+' '+d)" | tr -d '\r')
read -r STATUS VALID REJECTED LISTINGS DISTINCT <<<"$RESULT"
echo "   job: $STATUS, valid=$VALID rejected=$REJECTED; listings=$LISTINGS, distinct CSV rows=$DISTINCT"
if [ "$STATUS" = "completed" ] && [ "$VALID" = "$RECORDS" ] && [ "$REJECTED" = "0" ] && [ "$LISTINGS" = "$RECORDS" ] && [ "$DISTINCT" = "$RECORDS" ]; then
  echo "PASS: the import resumed after the crash and every row became exactly one listing."
else
  echo "FAIL"; exit 1
fi
