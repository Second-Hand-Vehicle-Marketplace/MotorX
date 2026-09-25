import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { AppError } from '../../shared/errors/AppError.js';
import { detectDocumentType, sanitizeDealerDocument } from './dealerDocument.content.js';

const pdf = (body: string) => Buffer.from(`%PDF-1.7\n1 0 obj\n<< /Type /Catalog ${body} >>\nendobj\n%%EOF\n`, 'latin1');
const file = (buffer: Buffer, originalname = 'document.pdf') => ({ buffer, originalname });

describe('detectDocumentType', () => {
  it('identifies files by their bytes, not their name or declared type', async () => {
    const png = await sharp({ create: { width: 4, height: 4, channels: 3, background: '#fff' } }).png().toBuffer();
    expect(detectDocumentType(pdf(''))).toBe('application/pdf');
    expect(detectDocumentType(png)).toBe('image/png');
    expect(detectDocumentType(Buffer.from('MZ\x90\x00 fake executable'))).toBeUndefined();
  });
});

describe('sanitizeDealerDocument', () => {
  it('accepts a plain PDF unchanged', async () => {
    const plain = pdf('/Pages 2 0 R');

    const result = await sanitizeDealerDocument(file(plain));

    expect(result).toEqual({ body: plain, contentType: 'application/pdf' });
  });

  it.each([
    ['JavaScript', '/OpenAction << /S /JavaScript /JS (app.alert(1)) >>'],
    ['a launch action', '/OpenAction << /S /Launch /F (cmd.exe) >>'],
    ['an embedded file', '/Names << /EmbeddedFiles 3 0 R >>'],
  ])('rejects a PDF containing %s', async (_label, body) => {
    await expect(sanitizeDealerDocument(file(pdf(body)))).rejects.toMatchObject({ statusCode: 400 });
  });

  it('does not mistake /JSON-like names for scripts', async () => {
    await expect(sanitizeDealerDocument(file(pdf('/JSONData (x)')))).resolves.toMatchObject({ contentType: 'application/pdf' });
  });

  it('rejects an executable renamed to .pdf', async () => {
    const renamed = file(Buffer.from('MZ\x90\x00 this is really a program'), 'id-card.pdf');

    await expect(sanitizeDealerDocument(renamed)).rejects.toBeInstanceOf(AppError);
  });

  it('re-encodes image documents and strips their metadata', async () => {
    const photo = await sharp({ create: { width: 120, height: 80, channels: 3, background: '#ddd' } })
      .jpeg()
      .withExif({ IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '6/1 55/1 0/1' } })
      .toBuffer();

    const result = await sanitizeDealerDocument(file(photo, 'id.jpg'));
    const metadata = await sharp(result.body).metadata();

    expect(result.contentType).toBe('image/jpeg');
    expect(metadata.format).toBe('jpeg');
    expect(metadata.exif).toBeUndefined();
  });

  it('rejects a file that only starts like a JPEG', async () => {
    const fake = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from('not an image')]);

    await expect(sanitizeDealerDocument(file(fake, 'id.jpg'))).rejects.toMatchObject({ statusCode: 400 });
  });
});
