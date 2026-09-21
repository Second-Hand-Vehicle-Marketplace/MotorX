// One-off migration for the multi-category vehicle listing refactor.
//
// Backfills `registrationNumber`, `normalizedRegistrationNumber`, `category`, and `attributes`
// on listings created before this refactor (which only had top-level mileageKm/fuelType/
// transmission, no registration number or category at all). Every pre-existing listing in this
// project was a car, so it backfills category: 'car' and moves mileageKm/fuelType/transmission
// into `attributes`, adding a synthetic registration number and 'other'/'used' defaults for the
// fields that never existed before (bodyType/condition).
//
// Safe to re-run: only touches documents missing `category`.
//
// Usage: MONGODB_URI=... node scripts/migrate-vehicle-categories.mjs [--dry-run]

import mongoose from 'mongoose';

const dryRun = process.argv.includes('--dry-run');
const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI is required.');

await mongoose.connect(uri);
const listings = mongoose.connection.collection('listings');

const legacyDocs = await listings.find({ category: { $exists: false } }).toArray();
console.log(`Found ${legacyDocs.length} pre-refactor listing(s) to migrate.`);

let migrated = 0;
for (const doc of legacyDocs) {
  const suffix = doc._id.toString().slice(-6).toUpperCase();
  const registrationNumber = `LEGACY-${suffix}`;
  const normalizedRegistrationNumber = `LEGACY${suffix}`;
  const attributes = {
    fuelType: doc.fuelType ?? 'petrol',
    transmission: doc.transmission ?? 'automatic',
    bodyType: 'other',
    condition: 'used',
    mileageKm: doc.mileageKm ?? 0,
  };

  console.log(`- ${doc._id} "${doc.title}" -> registrationNumber=${registrationNumber}, category=car, attributes=${JSON.stringify(attributes)}`);

  if (!dryRun) {
    await listings.updateOne(
      { _id: doc._id },
      { $set: { registrationNumber, normalizedRegistrationNumber, category: 'car', attributes }, $unset: { mileageKm: '', fuelType: '', transmission: '' } },
    );
  }
  migrated += 1;
}

console.log(dryRun ? `Dry run complete: ${migrated} listing(s) would be migrated.` : `Migrated ${migrated} listing(s).`);
await mongoose.disconnect();
