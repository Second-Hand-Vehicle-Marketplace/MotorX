import { parse } from 'csv-parse/sync';
import unzipper from 'unzipper';

export type ImageFile = { buffer: Buffer; contentType: string; originalPath: string };
export type ExtractedInventory = { rows: Record<string, unknown>[]; images: Map<string, ImageFile> };

export async function extract(csvBuffer: Buffer, zipBuffer: Buffer): Promise<ExtractedInventory> {
	const rows = parse(csvBuffer.toString('utf8'), { columns: true, skip_empty_lines: true, bom: true, relax_column_count: true }) as Record<string, unknown>[];
	const images = new Map<string, ImageFile>();
	const directory = await unzipper.Open.buffer(zipBuffer);
	for (const entry of directory.files) {
		if (entry.type !== 'File' || !/\.(png|jpe?g|webp|gif)$/i.test(entry.path)) continue;
		const normalized = entry.path.replace(/\\/g, '/').replace(/^\.\//, '').toLowerCase();
		const extension = normalized.split('.').pop() ?? 'jpeg';
		const image = { buffer: await entry.buffer(), contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`, originalPath: entry.path };
		images.set(normalized, image);
		images.set(normalized.split('/').pop() ?? normalized, image);
	}
	return { rows, images };
}
