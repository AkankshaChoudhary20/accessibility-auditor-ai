import type { NextRequest } from 'next/server';

export function checkOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) throw new Error('Cross-origin requests are blocked.');
}
export async function readBody(request: NextRequest) {
  const raw = await request.text();
  if (raw.length > 32_000) throw new Error('Request is too large.');
  return JSON.parse(raw);
}
