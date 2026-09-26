import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { InvalidImageError, reencodeImage } from './imageReencode.js';

const webpOptions = { maxDimension: 2560, output: 'webp', quality: 82 } as const;

describe('reencodeImage', () => {
  it('rebuilds a JPEG as WebP and removes EXIF metadata such as GPS location', async () => {
    const photo = await sharp({ create: { width: 64, height: 40, channels: 3, background: '#4a6fa5' } })
      .jpeg()
      .withExif({ IFD0: { Make: 'TestPhone' }, IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '6/1 55/1 0/1' } })
      .toBuffer();
    expect((await sharp(photo).metadata()).exif).toBeDefined();

    const metadata = await sharp(await reencodeImage(photo, webpOptions)).metadata();

    expect(metadata.format).toBe('webp');
    expect(metadata.exif).toBeUndefined();
  });

  it('applies EXIF orientation before stripping it, so photos stay upright', async () => {
    // Stored landscape (80x40) with orientation 6 = "rotate 90° to display": the viewer sees portrait.
    const sideways = await sharp({ create: { width: 80, height: 40, channels: 3, background: '#888888' } }).jpeg().withMetadata({ orientation: 6 }).toBuffer();

    const { width, height } = await sharp(await reencodeImage(sideways, webpOptions)).metadata();

    expect([width, height]).toEqual([40, 80]);
  });

  it('drops data hidden after the image', async () => {
    const png = await sharp({ create: { width: 16, height: 16, channels: 3, background: '#ff0000' } }).png().toBuffer();
    const polyglot = Buffer.concat([png, Buffer.from('<script>alert(document.cookie)</script>')]);

    const output = await reencodeImage(polyglot, webpOptions);

    expect(output.includes(Buffer.from('<script>'))).toBe(false);
  });

  it('refuses an image over the 40 megapixel cap even though the file is small', async () => {
    const bomb = await sharp({ create: { width: 6400, height: 6400, channels: 3, background: '#000000' } }).png({ compressionLevel: 9 }).toBuffer();
    expect(bomb.length).toBeLessThan(1_000_000);

    await expect(reencodeImage(bomb, webpOptions)).rejects.toThrow(/pixel limit/i);
  });

  it('refuses content that only starts like an image', async () => {
    const fake = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from('not really a jpeg')]);

    await expect(reencodeImage(fake, webpOptions)).rejects.toBeInstanceOf(InvalidImageError);
  });

  it('refuses decodable formats that are not allowed, such as SVG and GIF', async () => {
    const gif = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#00ff00' } }).gif().toBuffer();
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8"/></svg>');

    await expect(reencodeImage(gif, webpOptions)).rejects.toThrow(/Unsupported image format: gif/);
    await expect(reencodeImage(svg, webpOptions)).rejects.toThrow(/Unsupported image format: svg/);
  });

  it('keeps PNG documents as PNG and shrinks them to the requested size', async () => {
    const scan = await sharp({ create: { width: 5000, height: 3000, channels: 3, background: '#ffffff' } }).png().toBuffer();

    const metadata = await sharp(await reencodeImage(scan, { maxDimension: 4000, output: 'png', quality: 90 })).metadata();

    expect(metadata.format).toBe('png');
    expect([metadata.width, metadata.height]).toEqual([4000, 2400]);
  });
});
