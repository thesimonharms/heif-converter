import { trackBufferBody } from '@pondoknusa/http';

export function downloadResponse(bytes: Uint8Array, mime: string, filename: string): Response {
  const headers = new Headers({
    'content-type': mime,
    'content-disposition': contentDisposition(filename),
    'content-length': String(bytes.byteLength),
    'cache-control': 'no-store',
  });

  return trackBufferBody(new Response(bytes, { headers }), bytes);
}

export function contentDisposition(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_');
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
