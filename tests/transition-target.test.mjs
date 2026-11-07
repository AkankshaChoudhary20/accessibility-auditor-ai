import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isPublicAddress,validateTarget} from '../lib/target.mjs';
test('6to4 transition targets are rejected including embedded private IPv4',async()=>{
 for(const address of ['2002:7f00:1::','2002:0a00:1::','2002:a9fe:a9fe::']){
  assert.equal(isPublicAddress(address),false);
  await assert.rejects(validateTarget(`https://[${address}]/`),/blocked/);
 }
 assert.equal(isPublicAddress('2606:4700:4700::1111'),true);
});
