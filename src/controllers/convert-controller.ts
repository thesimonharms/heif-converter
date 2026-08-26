import { View } from '@pondoknusa/core';
import { Response } from '@pondoknusa/http';
import type { PondoknusaRequest } from '@pondoknusa/http';
import {
  ConversionError,
  convertImages,
  parseOutputFormat,
  parseQuality,
  type SourceImage,
} from '../conversion/heif-converter.js';
import { downloadResponse } from '../http/file-response.js';

export class ConvertController {
  async index(_request: PondoknusaRequest) {
    return Response.html(
      await View.render('home', {
        title: 'HEIF Converter',
      }),
    );
  }

  async convert(request: PondoknusaRequest) {
    try {
      const form = await request.formData();
      const format = parseOutputFormat(form.get('format'));
      const quality = parseQuality(form.get('quality'));
      const images = await collectImages(form);

      const asset = await convertImages(images, format, quality);
      return downloadResponse(asset.bytes, asset.mime, asset.filename);
    } catch (error) {
      if (error instanceof ConversionError) {
        return Response.json({ error: error.message }, { status: error.status });
      }

      const message = error instanceof Error ? error.message : 'Conversion failed.';
      return Response.json({ error: message }, { status: 500 });
    }
  }
}

async function collectImages(form: FormData): Promise<SourceImage[]> {
  const entries = [...form.getAll('files'), ...form.getAll('file')];
  const images: SourceImage[] = [];

  for (const entry of entries) {
    if (typeof entry === 'string') {
      continue;
    }
    if (!(entry instanceof File) || entry.size === 0) {
      continue;
    }

    images.push({
      filename: entry.name || 'image.heic',
      bytes: new Uint8Array(await entry.arrayBuffer()),
    });
  }

  return images;
}
