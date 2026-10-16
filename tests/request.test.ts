import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {NextRequest} from 'next/server';
import {readBody} from '../lib/request';
const request = (raw:string) => new Request('https://example.test', {method:'POST', body:raw}) as unknown as NextRequest;
test('reads valid JSON objects including split UTF-8 characters',async()=>{
  const bytes=new TextEncoder().encode('{"text":"€"}');
  const body=new ReadableStream({start(controller){for(const b of bytes)controller.enqueue(new Uint8Array([b]));controller.close();}});
  assert.deepEqual(await readBody({body} as NextRequest),{text:'€'});
});
test('size limit counts bytes rather than JavaScript characters',async()=>{
  await assert.rejects(readBody(request(JSON.stringify({text:'€'.repeat(11000)}))),/too large/);
});
test('oversized streams are cancelled before reading the full body',async()=>{
  let cancelled=false, reads=0;
  const body=new ReadableStream({pull(controller){reads++;controller.enqueue(new Uint8Array(16000));},cancel(){cancelled=true;}});
  await assert.rejects(readBody({body} as NextRequest),/too large/);
  assert.equal(cancelled,true);assert.ok(reads<=4);
});
test('requires an object and valid JSON',async()=>{
  for(const raw of ['null','[]','true','bad'])await assert.rejects(readBody(request(raw)));
});
