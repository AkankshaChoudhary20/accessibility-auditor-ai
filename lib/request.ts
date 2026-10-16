import type { NextRequest } from 'next/server';

export function checkOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) throw new Error('Cross-origin requests are blocked.');
}
export async function readBody(request: NextRequest) {
  if (!request.body) throw new Error('A JSON request body is required.');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 32_000) {
        await reader.cancel();
        throw new Error('Request is too large.');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const body = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(bytes));
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('A JSON object is required.');
  return body;
}
