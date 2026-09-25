// Drill helper: stores a generated CSV, creates its upload job, and queues it, exactly as the
// backend would after a dealer upload. Prints the upload job id. Used by
// scripts/drills/kill-worker-mid-import.sh; run inside the test stack (development image):
//   npx tsx src/drills/seedImport.ts 60000
import { CreateBucketCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { inventoryBullJobId } from '@motorx/shared-contracts';
import mongoose, { Types } from 'mongoose';
import { env } from '../config/env.js';
import { inventoryQueueProducer } from '../config/queue.js';
import { disconnectWorkerRedis } from '../config/redis.js';
import { workerStorageClient, workerStorageConfig } from '../config/storage.js';

const records = Number(process.argv[2] ?? 60_000);
const header = 'registrationNumber,title,make,model,year,price,mileageKm,fuelType,transmission,bodyType,condition,engineCapacityCc,location\n';
const rows = Array.from({ length: records }, (_, index) => `DR-${String(index).padStart(6, '0')},Toyota Corolla ${2005 + (index % 20)},Toyota,Corolla,${2005 + (index % 20)},${3_000_000 + index},${10_000 + index},petrol,automatic,sedan,used,1500,Colombo`);

await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
await workerStorageClient.send(new CreateBucketCommand({ Bucket: workerStorageConfig.bucket })).catch(() => undefined);
const storageKey = `inventory/drill/${Date.now()}.csv`;
await workerStorageClient.send(new PutObjectCommand({ Bucket: workerStorageConfig.bucket, Key: storageKey, Body: header + rows.join('\n') + '\n', ContentType: 'text/csv' }));
const { insertedId } = await mongoose.connection.collection('uploadJobs').insertOne({
  dealerId: new Types.ObjectId(), storageKey, fileName: 'drill.csv', fileSize: 1, category: 'car', status: 'pending',
  attemptCount: 0, imageProcessingStatus: 'none', imageAttemptCount: 0, createdAt: new Date(), updatedAt: new Date(),
});
await inventoryQueueProducer.add('process-inventory', { uploadJobId: String(insertedId) }, { jobId: inventoryBullJobId.csv(String(insertedId)) });
console.log(`UPLOAD_JOB_ID=${String(insertedId)}`);
await inventoryQueueProducer.close();
await disconnectWorkerRedis();
await mongoose.disconnect();
