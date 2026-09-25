import { AppError } from '../../shared/errors/AppError.js';
import { errorCodes } from '../../shared/errors/errorCodes.js';
import { InvalidImageError, reencodeImage } from '../../shared/utils/imageReencode.js';

export type DealerDocumentContentType = 'application/pdf' | 'image/jpeg' | 'image/png';

// Scans must stay readable for identity checks, so documents keep more detail than listing photos.
const DOCUMENT_MAX_DIMENSION_PX = 4000;
const DOCUMENT_JPEG_QUALITY = 90;

// PDF features that run code or carry other files. A scanned ID or business registration never
// needs them, and they are how malicious PDFs attack whoever opens them (here: administrators).
// `\b` keeps names such as /JSON from matching /JS.
const PDF_ACTIVE_CONTENT = /\/(JavaScript|JS|Launch|EmbeddedFiles?|RichMedia|XFA)\b/;

// Identifies a file by its actual bytes; the browser-declared MIME type is never trusted.
export function detectDocumentType(buffer: Buffer): DealerDocumentContentType | undefined {
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString('latin1') === '%PDF-') return 'application/pdf';
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  return undefined;
}

// Validates one verification document and returns the bytes that may be stored.
// Images are rebuilt from their pixels (no metadata such as GPS location, no hidden data);
// PDFs are accepted only when they contain no scripts, launch actions, or embedded files.
// This is a content check, not an antivirus scan.
export async function sanitizeDealerDocument(file: Pick<Express.Multer.File, 'buffer' | 'originalname'>): Promise<{ body: Buffer; contentType: DealerDocumentContentType }> {
  const contentType = detectDocumentType(file.buffer);
  if (!contentType) throw new AppError(400, errorCodes.validation, `"${file.originalname}" is not a real PDF, JPG, or PNG file.`);

  if (contentType === 'application/pdf') {
    if (PDF_ACTIVE_CONTENT.test(file.buffer.toString('latin1')))
      throw new AppError(400, errorCodes.validation, `"${file.originalname}" contains scripts or embedded files. Upload a plain scanned PDF or a photo instead.`);
    return { body: file.buffer, contentType };
  }

  try {
    const output = contentType === 'image/jpeg' ? 'jpeg' : 'png';
    const body = await reencodeImage(file.buffer, { maxDimension: DOCUMENT_MAX_DIMENSION_PX, output, quality: DOCUMENT_JPEG_QUALITY });
    return { body, contentType };
  } catch (error) {
    if (error instanceof InvalidImageError) throw new AppError(400, errorCodes.validation, `"${file.originalname}" could not be read as an image.`);
    throw error;
  }
}
