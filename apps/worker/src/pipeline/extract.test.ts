import { Readable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { extractCsvBatches } from './extract.js';

describe('CSV extraction', () => {
  it('streams records in bounded batches and reports cumulative progress', async () => {
    const csv = 'title,make,year\nOne,Toyota,2022\nTwo,Honda,2021\nThree,Mazda,2020\n';
    const sizes: number[] = []; const progress: number[] = [];
    const total = await extractCsvBatches(Readable.from(csv), 2, async (rows, processed) => { sizes.push(rows.length); progress.push(processed); });
    expect(sizes).toEqual([2, 1]); expect(progress).toEqual([2, 3]); expect(total).toBe(3);
  });

  it('rejects rows whose column count does not match the header', async () => {
    const csv = 'title,make\nOne,Toyota,unexpected\n';
    await expect(extractCsvBatches(Readable.from(csv), 10, async () => undefined)).rejects.toThrow();
  });
});
