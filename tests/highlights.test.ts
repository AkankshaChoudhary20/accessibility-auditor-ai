import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {Page} from 'playwright';
import {inspectPage} from '../lib/audit';
test('multiple violations on one selector create one highlight', async () => {
  let calls=0;
  const page={goto:async()=>{},addScriptTag:async()=>{},
    evaluate:async (_fn:unknown, targets?:string[])=> {
      if(calls++===0)return {violations:['label','contrast'].map(id=>({id,nodes:[{target:['#field'],html:'<input>'}],tags:[]})),passes:[],incomplete:[],testEngine:{version:'test'}};
      assert.deepEqual(targets,['#field']); return targets!.length;
    },screenshot:async()=>Buffer.from('image'),url:()=> 'https://example.com',title:async()=> 'Fixture'};
  assert.equal((await inspectPage(page as unknown as Page,'https://example.com')).highlightedElements,1);
});
