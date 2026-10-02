import { NextRequest, NextResponse } from 'next/server';
import { audit } from '@/lib/audit';
import { checkOrigin, readBody } from '@/lib/request';
export const runtime = 'nodejs';
export const maxDuration = 60;
let busy = false;
export async function POST(request: NextRequest) {
  if (busy) return NextResponse.json({error: 'An audit is already running. Try again shortly.'}, {status: 429});
  try {
    checkOrigin(request);
    const body = await readBody(request);
    if (typeof body.url !== 'string' || body.url.length > 2048) throw new Error('Enter a valid URL.');
    busy = true;
    try { return NextResponse.json(await audit(body.url)); }
    finally { busy = false; }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Audit failed.';
    return NextResponse.json({error: message.includes('browserType.launch') ? 'Chromium is missing. Run npx playwright install chromium.' : message.slice(0,300)}, {status: 400});
  }
}
