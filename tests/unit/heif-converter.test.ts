import { describe, expect, it } from 'vitest';
import {
  convertImages,
  looksLikeHeif,
  parseOutputFormat,
  parseQuality,
} from '../../src/conversion/heif-converter.js';

const TINY_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRQBAwQEBQQFCQUFCRQNCw0UFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFP/AABEIAAEAAQMBEQACEQEDEQH/xAGiAAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgsQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+gEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoLEQACAQIEBAMEBwUEBAABAncAAQIDEQQFITEGEkFRB2FxEyIygQgUQpGhscEJIzNS8BVictEKFiQ04SXxFxgZGiYnKCkqNTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dri4+Tl5ufo6ery8/T19vf4+fr/2gAMAwEAAhEDEQA/ACv56P7zP//Z',
  'base64',
);

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAklEQVR4AewaftIAAAALSURBVGP4H6DxHwAGQAJ35p+9GAAAAABJRU5ErkJggg==',
  'base64',
);

const fakeHeif = {
  filename: 'IMG_1000.HEIC',
  bytes: fakeHeifBytes(),
};

describe('heif converter', () => {
  it('accepts heif brands and extensions', () => {
    expect(looksLikeHeif(fakeHeifBytes(), 'photo.bin')).toBe(true);
    expect(looksLikeHeif(new Uint8Array([0, 0, 0, 0]), 'vacation.heic')).toBe(true);
    expect(looksLikeHeif(new Uint8Array([0, 0, 0, 0]), 'notes.txt')).toBe(false);
  });

  it('normalizes format and quality', () => {
    expect(parseOutputFormat('JPG')).toBe('jpeg');
    expect(parseOutputFormat('pdf')).toBe('pdf');
    expect(parseQuality('85')).toBe(0.85);
    expect(parseQuality(1)).toBe(1);
    expect(() => parseOutputFormat('gif')).toThrow(/jpeg, png, or pdf/);
  });

  it('returns a jpeg for a single image', async () => {
    const result = await convertImages([fakeHeif], 'jpeg', 0.9, rasterizer);
    expect(result.mime).toBe('image/jpeg');
    expect(result.filename).toBe('IMG_1000.jpg');
    expect(result.bytes.byteLength).toBeGreaterThan(0);
  });

  it('zips multiple jpeg outputs', async () => {
    const result = await convertImages(
      [fakeHeif, { filename: 'second.heif', bytes: fakeHeif.bytes }],
      'jpeg',
      0.9,
      rasterizer,
    );
    expect(result.mime).toBe('application/zip');
    expect(result.filename).toBe('heif-images.zip');
  });

  it('builds a combined pdf', async () => {
    const result = await convertImages(
      [fakeHeif, { filename: 'second.heic', bytes: fakeHeif.bytes }],
      'pdf',
      0.9,
      rasterizer,
    );
    expect(result.mime).toBe('application/pdf');
    expect(result.filename).toBe('heif-images.pdf');
    expect(decodeAscii(result.bytes, 0, 5)).toBe('%PDF-');
  });
});

async function rasterizer(_input: Buffer, format: 'JPEG' | 'PNG'): Promise<Uint8Array> {
  return new Uint8Array(format === 'PNG' ? TINY_PNG : TINY_JPEG);
}

function fakeHeifBytes(): Uint8Array {
  const bytes = new Uint8Array(24);
  bytes.set(Buffer.from('ftyp', 'ascii'), 4);
  bytes.set(Buffer.from('heic', 'ascii'), 8);
  return bytes;
}

function decodeAscii(bytes: Uint8Array, start: number, end: number): string {
  return String.fromCharCode(...bytes.subarray(start, end));
}
