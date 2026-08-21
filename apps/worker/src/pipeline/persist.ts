import { Types } from 'mongoose';
import { insertImportedListings } from '../repositories/listing.repository.js';
import { insertRejectedRecords, type RejectedInventoryRecord } from '../repositories/rejectedRecord.repository.js';
import type { ValidInventoryRow } from './validate.js';

// Applies trusted ownership fields before inserting validated rows as drafts.
export async function persistValidRows(dealerId: Types.ObjectId, uploadJobId: Types.ObjectId, rows: ValidInventoryRow[]) { return insertImportedListings(rows.map((row) => ({ ...row, dealerId, sourceUploadJobId: uploadJobId, images: [] as [], status: 'draft' as const }))); }

// Persists rejected rows without allowing one invalid record to block valid listings.
export async function persistRejectedRows(records: RejectedInventoryRecord[]) { return insertRejectedRecords(records); }
