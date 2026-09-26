import { CreateBucketCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import mongoose, { Types } from 'mongoose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// SRS performance target: import 5,000 inventory records within two minutes.
// Runs the real CSV pipeline (parse, validate, duplicate check, embeddings, insert, checkpoints)
// against real MongoDB and S3-compatible storage. Only runs when asked, because it is slow:
//   docker compose -f compose.yml -f compose.test.yml run --rm -e RUN_BENCHMARKS=1 worker \
//     npx vitest run src/benchmarks --maxWorkers=1
const RECORDS = 5_000;
const TARGET_MS = 120_000;
const uri = process.env.TEST_MONGODB_URI;
const enabled = process.env.RUN_BENCHMARKS === '1' && !!uri && /\/motorx_test([_-][a-z0-9-]+)?(\?|$)/i.test(uri);

const header = 'registrationNumber,title,make,model,year,price,mileageKm,fuelType,transmission,bodyType,condition,engineCapacityCc,location\n';
const makes = [['Toyota', 'Corolla'], ['Honda', 'Civic'], ['Suzuki', 'Swift'], ['Nissan', 'Sunny'], ['Mitsubishi', 'Lancer']] as const;
function csv(records: number) {
  const rows = Array.from({ length: records }, (_, index) => {
    const [make, model] = makes[index % makes.length]!;
    const year = 2005 + (index % 20);
    return `BM-${String(index).padStart(5, '0')},${make} ${model} ${year},${make},${model},${year},${3_000_000 + index * 1_000},${10_000 + index},petrol,automatic,sedan,used,1500,Colombo`;
  });
  return header + rows.join('\n') + '\n';
}

describe.skipIf(!enabled)(`CSV import throughput (${RECORDS} records)`, () => {
  let extractInventoryUpload: (id: string) => Promise<{ stage: string; validRecords?: number }>;

  beforeAll(async () => {
    await mongoose.connect(uri!, { serverSelectionTimeoutMS: 10_000 });
    ({ extractInventoryUpload } = await import('../services/uploadJob.service.js'));
    await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
    // Clear after the models load: before that, no collections are registered and nothing would be
    // cleared, so a second run would see the first run's listings and reject every row as a duplicate.
    await Promise.all(Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({})));
  }, 60_000);
  afterAll(async () => { await mongoose.disconnect(); });

  it(`imports ${RECORDS} records within ${TARGET_MS / 1000} s`, async () => {
    const { workerStorageClient, workerStorageConfig } = await import('../config/storage.js');
    await workerStorageClient.send(new CreateBucketCommand({ Bucket: workerStorageConfig.bucket })).catch(() => undefined);
    const storageKey = `inventory/benchmark/${Date.now()}.csv`;
    await workerStorageClient.send(new PutObjectCommand({ Bucket: workerStorageConfig.bucket, Key: storageKey, Body: csv(RECORDS), ContentType: 'text/csv' }));
    const dealerId = new Types.ObjectId();
    const { insertedId } = await mongoose.connection.collection('uploadJobs').insertOne({
      dealerId, storageKey, fileName: 'benchmark.csv', fileSize: 1, category: 'car', status: 'pending', attemptCount: 0, imageProcessingStatus: 'none', imageAttemptCount: 0, createdAt: new Date(), updatedAt: new Date(),
    });

    const started = performance.now();
    const result = await extractInventoryUpload(String(insertedId));
    const elapsedMs = performance.now() - started;

    const imported = await mongoose.connection.collection('listings').countDocuments({ sourceUploadJobId: insertedId });
    console.log(`[benchmark] ${RECORDS} records imported in ${(elapsedMs / 1000).toFixed(1)} s (${Math.round(RECORDS / (elapsedMs / 1000))} records/s); target ${TARGET_MS / 1000} s.`);
    expect(result).toMatchObject({ stage: 'completed', validRecords: RECORDS });
    expect(imported).toBe(RECORDS);
    expect(elapsedMs).toBeLessThan(TARGET_MS);
  }, TARGET_MS + 60_000);
});
