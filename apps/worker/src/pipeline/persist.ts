import { Types } from 'mongoose';
import { insertImportedListings, type ImportableListing } from '../repositories/listing.repository.js';
import { insertRejectedRecords, type RejectedInventoryRecord } from '../repositories/rejectedRecord.repository.js';
import type { ValidInventoryRow } from './validate.js';
import { composeListingSearchText } from '@motorx/shared-contracts';
import { generateEmbedding } from './generateEmbedding.js';

// Applies trusted ownership fields before inserting validated rows as drafts.
export async function persistValidRows(dealerId: Types.ObjectId, uploadJobId: Types.ObjectId, rows: ValidInventoryRow[]) {
  const enrichedRows = new Array<ImportableListing>(rows.length);
  let nextIndex = 0;
  // A small pool prevents a large CSV batch from overwhelming the embedding provider.
  await Promise.all(Array.from({ length: Math.min(8, rows.length) }, async () => {
    while (nextIndex < rows.length) {
      const index = nextIndex++;
      const row = rows[index];
      let embedding: number[] | undefined;
      try { embedding = await generateEmbedding(composeListingSearchText(row)); } catch { embedding = undefined; }
      enrichedRows[index] = { ...row, dealerId, sourceUploadJobId: uploadJobId, images: [], status: 'draft', embedding };
    }
  }));
  return insertImportedListings(enrichedRows);
}

// Persists rejected rows without allowing one invalid record to block valid listings.
export async function persistRejectedRows(records: RejectedInventoryRecord[]) { return insertRejectedRecords(records); }
