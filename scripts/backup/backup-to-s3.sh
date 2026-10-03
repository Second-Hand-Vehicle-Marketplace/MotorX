#!/usr/bin/env bash
# Nightly backup set for the single-server (EC2) deployment. Writes are paused for a few minutes so
# the MongoDB dump and the MinIO files (CSVs, photos, dealer documents) describe the same moment, then
# both go to a private S3 bucket under one set ID. Run from the repository root on the EC2 host, e.g.
# from cron at 02:30 (the site answers 502 for API calls while the backend is stopped):
#
#   30 2 * * * cd /home/ec2-user/MotorX && BACKUP_BUCKET=motorx-backups BACKUP_PING_URL=https://hc-ping.com/<uuid> bash scripts/backup/backup-to-s3.sh >> /var/log/motorx-backup.log 2>&1
#
# Needs the AWS CLI on the host and an instance role allowed to s3:PutObject and s3:GetObject on the
# bucket (no keys on the server). The bucket must block public access, use default encryption (the
# dump holds personal data) and expire old sets with a lifecycle rule (14 days). BACKUP_PING_URL is a
# healthchecks.io check scheduled for 02:30 daily: it alerts on failures and on runs that never happen.
# A set is usable only when its COMPLETE marker exists.
set -euo pipefail

: "${BACKUP_BUCKET:?Set BACKUP_BUCKET to the private S3 bucket name}"
KEEP_LOCAL_DAYS="${KEEP_LOCAL_DAYS:-3}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/motorx}"
COMPOSE=(docker compose -f compose.yml -f compose.ec2.yml -f compose.lb.yml)
SET_ID="$(date -u +%Y-%m-%dT%H%M%SZ)"
SET_DIR="$BACKUP_DIR/$SET_ID"
paused=0

ping() { if [ -n "${BACKUP_PING_URL:-}" ]; then curl -fsS -m 10 --retry 3 "${BACKUP_PING_URL}$1" > /dev/null || true; fi; }
resume() { if [ "$paused" = 1 ]; then "${COMPOSE[@]}" start backend worker; paused=0; fi; }
finish() {
  local status=$?
  resume || status=1
  if [ "$status" -ne 0 ]; then echo "[$SET_ID] Backup FAILED" >&2; ping /fail; fi
}
trap finish EXIT

# Read MONGODB_URI from .env without printing it.
MONGODB_URI="$(grep -E '^MONGODB_URI=' .env | head -n 1 | cut -d= -f2- | sed -e 's/^ *//' -e 's/^"//' -e 's/"$//')"
[ -n "$MONGODB_URI" ] || { echo "MONGODB_URI not found in .env" >&2; exit 1; }

ping /start
mkdir -p "$SET_DIR"

# 1. Pause writes and file clean-up: the API and the workers (which run the retention job) stop.
echo "[$SET_ID] Pausing backend and workers"
paused=1
"${COMPOSE[@]}" stop worker backend

# 2. Capture both halves of the set while nothing writes.
echo "[$SET_ID] Dumping MongoDB"
docker run --rm -e MONGODB_URI="$MONGODB_URI" -v "$SET_DIR:/backup" mongo:7 \
  sh -c 'mongodump --uri="$MONGODB_URI" --gzip --archive=/backup/mongo.archive.gz --quiet'
echo "[$SET_ID] Archiving MinIO files"
docker run --rm -v motorx_minio_data:/data:ro -v "$SET_DIR:/backup" alpine \
  tar czf /backup/minio.tar.gz -C /data .

# 3. Resume service before the slower upload.
echo "[$SET_ID] Resuming backend and workers"
resume

# 4. Upload, check each object arrived whole, then mark the set complete.
for file in mongo.archive.gz minio.tar.gz; do
  aws s3 cp "$SET_DIR/$file" "s3://$BACKUP_BUCKET/$SET_ID/$file" --only-show-errors
  local_size="$(stat -c %s "$SET_DIR/$file")"
  remote_size="$(aws s3api head-object --bucket "$BACKUP_BUCKET" --key "$SET_ID/$file" --query ContentLength --output text)"
  if [ "$local_size" -le 0 ] || [ "$local_size" != "$remote_size" ]; then
    echo "[$SET_ID] $file: local $local_size bytes, S3 $remote_size bytes" >&2
    exit 1
  fi
done
echo "$SET_ID" | aws s3 cp - "s3://$BACKUP_BUCKET/$SET_ID/COMPLETE" --only-show-errors

# 5. Report success only for a complete set.
ping ""
find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -mtime +"$KEEP_LOCAL_DAYS" -exec rm -rf {} +
echo "[$SET_ID] Backup set complete"
