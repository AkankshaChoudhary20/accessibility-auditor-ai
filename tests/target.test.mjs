import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPublicAddress, validateTarget } from '../lib/target.mjs';
const publicDNS = async () => [{address: '93.184.216.34'}];
test('accepts public HTTP(S) destinations', async () => {
  assert.equal(await validateTarget('https://example.com/path', publicDNS), 'https://example.com/path');
});
test('rejects unsafe protocols, ports, credentials, and local destinations', async () => {
  for (const url of ['file:///etc/passwd','https://u:p@example.com','https://example.com:8080','http://127.0.0.1','http://10.0.0.1','http://[::1]','http://[::ffff:127.0.0.1]','http://169.254.169.254']) {
    await assert.rejects(validateTarget(url, publicDNS), url);
  }
});
test('rejects DNS names with any private answer', async () => {
  await assert.rejects(validateTarget('https://example.com', async () => [{address:'8.8.8.8'},{address:'192.168.1.2'}]));
});
test('filters private and reserved addresses', () => {
  for (const address of ['0.0.0.0','100.64.0.1','172.31.1.1','192.168.0.1','198.19.0.1','224.0.0.1','fc00::1','fe80::1','2001:db8::1']) assert.equal(isPublicAddress(address), false, address);
  assert.equal(isPublicAddress('8.8.8.8'), true);
});
