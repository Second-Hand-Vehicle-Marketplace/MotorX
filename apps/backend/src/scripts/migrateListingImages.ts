// One-off maintenance command: moves listing photos uploaded before re-encoding and the
// listing-images/ prefix existed, removing their metadata (such as GPS location) on the way.
//
//   node dist/scripts/migrateListingImages.js --dry-run          # report only, change nothing
//   node dist/scripts/migrateListingImages.js                    # migrate
//   node dist/scripts/migrateListingImages.js --public-url=https://cdn.example.com   # also rewrite URLs
//   add --keep-legacy to leave the original objects in place (delete them later by re-running without it)
//
// Safe to stop and re-run: photos already migrated are skipped.
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { storageClient, storageConfig } from '../config/storage.js';
import { ListingModel } from '../modules/marketplace/listing.model.js';
import { migrateListingImages } from './listingImageMigration.js';

const args = new Set(process.argv.slice(2));
const publicUrl = process.argv.slice(2).find((arg) => arg.startsWith('--public-url='))?.slice('--public-url='.length);
const notFound = (error: unknown) => typeof error === 'object' && error !== null && 'name' in error && ['NoSuchKey', 'NotFound'].includes(String(error.name));

await connectDatabase();
try {
  const summary = await migrateListingImages({
    async *listings() {
      for await (const listing of ListingModel.find({ 'images.0': { $exists: true } }).select('images').lean().cursor()) {
        yield { id: String(listing._id), images: (listing.images as Array<{ key: string; url: string }>) };
      }
    },
    async exists(key) {
      try { await storageClient.send(new HeadObjectCommand({ Bucket: storageConfig.bucket, Key: key })); return true; }
      catch (error) { if (notFound(error)) return false; throw error; }
    },
    async read(key) {
      try { const object = await storageClient.send(new GetObjectCommand({ Bucket: storageConfig.bucket, Key: key })); return object.Body ? Buffer.from(await object.Body.transformToByteArray()) : null; }
      catch (error) { if (notFound(error)) return null; throw error; }
    },
    async write(key, body, contentType) {
      await storageClient.send(new PutObjectCommand({ Bucket: storageConfig.bucket, Key: key, Body: body, ContentType: contentType, CacheControl: 'public, max-age=31536000, immutable' }));
    },
    async remove(key) { await storageClient.send(new DeleteObjectCommand({ Bucket: storageConfig.bucket, Key: key })); },
    async setImageUrls(listingId, urls) {
      await ListingModel.updateOne({ _id: listingId }, [{
        $set: { images: { $map: { input: '$images', as: 'image', in: { $mergeObjects: ['$$image', { url: { $ifNull: [{ $getField: { field: '$$image.key', input: urls } }, '$$image.url'] } }] } } } },
      }]);
    },
    log: (message) => console.warn(message),
  }, { dryRun: args.has('--dry-run'), keepLegacy: args.has('--keep-legacy'), publicUrl });
  console.log(`${args.has('--dry-run') ? '[dry run] ' : ''}Listing image migration finished.`, summary);
} finally {
  await disconnectDatabase();
  await mongoose.disconnect();
}
