import { createRequire } from 'node:module';
import { Buffer } from 'node:buffer';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';

const require = createRequire(import.meta.url);
const heicConvert = require('heic-convert') as HeicConvertFn;

const HEIF_BRANDS = new Set([
  'heic',
  'heix',
  'hevc',
  'hevx',
  'heim',
  'heis',
  'hevm',
  'hevs',
  'mif1',
  'msf1',
]);

const HEIF_EXTENSIONS = new Set(['.heic', '.heif', '.hif']);

export const OUTPUT_FORMATS = ['jpeg', 'png', 'pdf'] as const;
export type OutputFormat = (typeof OUTPUT_FORMATS)[number];

export interface SourceImage {
  filename: string;
  bytes: Uint8Array;
}

export interface ConvertedAsset {
  bytes: Uint8Array;
  filename: string;
  mime: string;
}

export type RasterFormat = 'JPEG' | 'PNG';

export type HeifRasterizer = (
  input: Buffer,
  format: RasterFormat,
  quality: number,
) => Promise<Uint8Array>;

type HeicConvertFn = {
  (options: { buffer: Buffer; format: RasterFormat; quality?: number }): Promise<ArrayBuffer>;
  all: (options: {
    buffer: Buffer;
    format: RasterFormat;
    quality?: number;
  }) => Promise<Array<{ convert(): Promise<ArrayBuffer> }>>;
};

const MAX_PDF_EDGE = 1440;

export const MAX_FILES = 40;
export const MAX_FILE_BYTES = 80 * 1024 * 1024;

export class ConversionError extends Error {
  constructor(
    message: string,
    readonly status = 422,
  ) {
    super(message);
    this.name = 'ConversionError';
  }
}

export function isOutputFormat(value: unknown): value is OutputFormat {
  return typeof value === 'string' && (OUTPUT_FORMATS as readonly string[]).includes(value);
}

export function parseOutputFormat(value: unknown): OutputFormat {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (normalized === 'jpg') {
    return 'jpeg';
  }
  if (isOutputFormat(normalized)) {
    return normalized;
  }
  throw new ConversionError('Choose jpeg, png, or pdf as the output format.');
}

export function parseQuality(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number.parseInt(String(value ?? '90'), 10);
  if (!Number.isFinite(numeric)) {
    return 0.9;
  }
  return Math.min(1, Math.max(0.1, numeric > 1 ? numeric / 100 : numeric));
}

export function looksLikeHeif(bytes: Uint8Array, filename = ''): boolean {
  const extension = extensionOf(filename);
  if (extension && HEIF_EXTENSIONS.has(extension)) {
    return true;
  }

  if (bytes.byteLength < 12) {
    return false;
  }

  const box = decodeAscii(bytes, 4, 8);
  if (box !== 'ftyp') {
    return false;
  }

  if (HEIF_BRANDS.has(decodeAscii(bytes, 8, 12))) {
    return true;
  }

  const compatibleEnd = Math.min(bytes.byteLength, 64);
  for (let offset = 16; offset + 4 <= compatibleEnd; offset += 4) {
    if (HEIF_BRANDS.has(decodeAscii(bytes, offset, offset + 4))) {
      return true;
    }
  }

  return false;
}

export async function defaultRasterizer(
  input: Buffer,
  format: RasterFormat,
  quality: number,
): Promise<Uint8Array> {
  const encoded = await heicConvert({
    buffer: input,
    format,
    quality,
  });
  return encoded instanceof Uint8Array ? encoded : new Uint8Array(encoded);
}

export async function convertImages(
  images: SourceImage[],
  format: OutputFormat,
  quality: number,
  rasterize: HeifRasterizer = defaultRasterizer,
): Promise<ConvertedAsset> {
  if (images.length === 0) {
    throw new ConversionError('Drop at least one HEIF or HEIC file.');
  }
  if (images.length > MAX_FILES) {
    throw new ConversionError(`Convert at most ${MAX_FILES} files at a time.`);
  }

  for (const image of images) {
    if (image.bytes.byteLength === 0) {
      throw new ConversionError(`${image.filename} is empty.`);
    }
    if (image.bytes.byteLength > MAX_FILE_BYTES) {
      throw new ConversionError(`${image.filename} is larger than 80 MB.`);
    }
    if (!looksLikeHeif(image.bytes, image.filename)) {
      throw new ConversionError(`${image.filename} does not look like a HEIF/HEIC image.`);
    }
  }

  if (format === 'pdf') {
    return convertToPdf(images, quality, rasterize);
  }

  const converted = await Promise.all(
    images.map(async (image) => {
      const bytes = await rasterizeHeif(image, format === 'png' ? 'PNG' : 'JPEG', quality, rasterize);
      return {
        bytes,
        filename: replaceExtension(image.filename, format === 'png' ? '.png' : '.jpg'),
        mime: format === 'png' ? 'image/png' : 'image/jpeg',
      } satisfies ConvertedAsset;
    }),
  );

  if (converted.length === 1) {
    return converted[0]!;
  }

  return zipAssets(converted);
}

async function rasterizeHeif(
  image: SourceImage,
  format: RasterFormat,
  quality: number,
  rasterize: HeifRasterizer,
): Promise<Uint8Array> {
  try {
    return await rasterize(Buffer.from(image.bytes), format, quality);
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown decoder error';
    throw new ConversionError(`Could not decode ${image.filename}: ${reason}`);
  }
}

async function convertToPdf(
  images: SourceImage[],
  quality: number,
  rasterize: HeifRasterizer,
): Promise<ConvertedAsset> {
  const pdf = await PDFDocument.create();

  for (const image of images) {
    const jpeg = copyBytes(await rasterizeHeif(image, 'JPEG', quality, rasterize));
    const embedded = await pdf.embedJpg(jpeg);
    const { width, height } = scaleToMaxEdge(embedded.width, embedded.height, MAX_PDF_EDGE);
    const page = pdf.addPage([width, height]);
    page.drawImage(embedded, { x: 0, y: 0, width, height });
  }

  const bytes = await pdf.save();
  const filename =
    images.length === 1 ? replaceExtension(images[0]!.filename, '.pdf') : 'heif-images.pdf';

  return {
    bytes,
    filename,
    mime: 'application/pdf',
  };
}

async function zipAssets(assets: ConvertedAsset[]): Promise<ConvertedAsset> {
  const zip = new JSZip();
  const used = new Map<string, number>();

  for (const asset of assets) {
    zip.file(uniqueName(asset.filename, used), asset.bytes);
  }

  return {
    bytes: await zip.generateAsync({ type: 'uint8array', compression: 'STORE' }),
    filename: 'heif-images.zip',
    mime: 'application/zip',
  };
}

function uniqueName(filename: string, used: Map<string, number>): string {
  const count = used.get(filename) ?? 0;
  used.set(filename, count + 1);
  if (count === 0) {
    return filename;
  }
  const extension = extensionOf(filename);
  const stem = extension ? filename.slice(0, -extension.length) : filename;
  return `${stem}-${count}${extension}`;
}

function scaleToMaxEdge(width: number, height: number, maxEdge: number): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) {
    return { width, height };
  }
  const scale = maxEdge / longest;
  return { width: width * scale, height: height * scale };
}

function replaceExtension(filename: string, extension: string): string {
  const base = filename.replace(/^.*[/\\]/, '') || 'image';
  const current = extensionOf(base);
  const stem = current ? base.slice(0, -current.length) : base;
  return `${stem || 'image'}${extension}`;
}

function extensionOf(filename: string): string {
  const match = filename.toLowerCase().match(/\.[a-z0-9]+$/);
  return match?.[0] ?? '';
}

function decodeAscii(bytes: Uint8Array, start: number, end: number): string {
  return String.fromCharCode(...bytes.subarray(start, end)).toLowerCase();
}

function copyBytes(bytes: Uint8Array): Uint8Array {
  return bytes.slice();
}
