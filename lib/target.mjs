import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

export function isPublicAddress(address) {
  if (isIP(address) === 4) {
    const [a,b,c] = address.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 168 || b === 0)) || (a === 100 && b >= 64 && b <= 127) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 192 && b === 0 && c === 2) ||
      (a === 198 && b === 51 && c === 100) ||
      (a === 203 && b === 0 && c === 113));
  }
  // Fail closed for mapped/transition addresses; only global unicast IPv6.
  return isIP(address) === 6 && /^[23][0-9a-f]{3}:/i.test(address) && !/^2001:(0:|db8:)/i.test(address);
}

export async function validateTarget(raw, resolve = lookup) {
  let url;
  try { url = new URL(raw); } catch { throw new Error('Enter a valid HTTP or HTTPS URL.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      (url.port && !['80','443'].includes(url.port))) {
    throw new Error('Use a public HTTP(S) URL on port 80 or 443 without credentials.');
  }
  const host = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = isIP(host) ? [{address: host}] : await resolve(host, {all: true});
  if (!addresses.length || addresses.some(({address}) => !isPublicAddress(address))) {
    throw new Error('Private, local, and reserved network destinations are blocked.');
  }
  return url.href;
}
