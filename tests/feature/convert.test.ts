import { describe, expect, it } from 'vitest';
import { withPondoknusaTest } from '@pondoknusa/testing';
import { AppTestCase } from '../support/app-test-case.js';

const t = withPondoknusaTest(AppTestCase);

describe('converter', () => {
  it('renders the converter page', async () => {
    const response = await t.http.get('http://localhost/');
    await response.assertOk();
    const html = await response.text();
    expect(html).toContain('HEIF to JPEG, PNG, and PDF');
    expect(html).toContain('Drop HEIF files here');
  });

  it('rejects a convert request without files', async () => {
    const body = new FormData();
    body.set('format', 'jpeg');
    const response = await t.http.post('http://localhost/api/convert', { body });
    response.assertStatus(422);
    await response.assertJson({ error: 'Drop at least one HEIF or HEIC file.' });
  });

  it('rejects a non-heif upload', async () => {
    const body = new FormData();
    body.set('format', 'png');
    body.append('files', new File([Uint8Array.from([1, 2, 3, 4])], 'notes.txt', { type: 'text/plain' }));
    const response = await t.http.post('http://localhost/api/convert', { body });
    response.assertStatus(422);
    await response.assertJson({
      error: 'notes.txt does not look like a HEIF/HEIC image.',
    });
  });
});
