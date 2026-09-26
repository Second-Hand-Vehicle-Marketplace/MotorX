import type { Readable } from 'node:stream';
import { parse } from 'csv-parse';

export type ExtractedInventoryRow = Record<string, string>;

// Streams CSV records into bounded batches without loading the entire file into memory.
// skipRecords resumes after a checkpoint: those leading records are parsed but not re-processed,
// and processedRecords keeps counting from the start of the file so row numbers stay stable.
export async function extractCsvBatches(stream: Readable, batchSize: number, onBatch: (rows: ExtractedInventoryRow[], processedRecords: number) => Promise<void>, skipRecords = 0) {
  const parser = stream.pipe(parse({ columns: true, bom: true, skip_empty_lines: true, trim: true, relax_column_count: false }));
  let batch: ExtractedInventoryRow[] = []; let processedRecords = 0;
  for await (const record of parser) {
    if (processedRecords < skipRecords) { processedRecords += 1; continue; }
    batch.push(record as ExtractedInventoryRow);
    if (batch.length < batchSize) continue;
    processedRecords += batch.length; await onBatch(batch, processedRecords); batch = [];
  }
  if (batch.length) { processedRecords += batch.length; await onBatch(batch, processedRecords); }
  return processedRecords;
}
