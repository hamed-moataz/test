import nacl from 'tweetnacl';
import { inflateRaw } from 'pako';

/**
 * Provide the SAME 32-byte key you configured on Laravel (decoded from base64).
 * Store it via env var at build time. Example with Vite:
 *   VITE_MEETLINK_SHARED_KEY_B64=3r0T3l3g1bLyUuCbi9bZ3k4+q3oXjv1m3lqQ2gY3q5k=
 */
const b64 = import.meta.env.VITE_MEETLINK_SHARED_KEY_B64;
if (!b64) throw new Error('VITE_MEETLINK_SHARED_KEY_B64 missing');

function b64ToBytesUrl(str) {
  const pad = str.length % 4 ? '='.repeat(4 - (str.length % 4)) : '';
  const s = (str + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(s);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function bytesToUtf8(bytes) {
  return new TextDecoder().decode(bytes);
}

function b64StdToBytes(str) {
  const raw = atob(str);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

const SHARED_KEY = b64StdToBytes(b64);
if (SHARED_KEY.length !== nacl.secretbox.keyLength) {
  throw new Error('shared key must be 32 bytes');
}

/**
 * Decrypts a token of the form "v1.<base64url(nonce||ciphertext)>".
 */
export function decryptMeetToken(token){
  const [version, body] = token.split('.', 2);
  if (version !== 'v1' || !body) throw new Error('Unsupported or invalid token');

  const blob = b64ToBytesUrl(body);
  const nonceLen = nacl.secretbox.nonceLength;
  if (blob.length <= nonceLen + 16) throw new Error('Token too short');

  const nonce = blob.slice(0, nonceLen);
  const box   = blob.slice(nonceLen);

  const opened = nacl.secretbox.open(box, nonce, SHARED_KEY);
  if (!opened) throw new Error('Decryption failed');

  // Decompress (inflateRaw matches PHP gzdeflate)
  const inflated = inflateRaw(opened);

  const json = bytesToUtf8(inflated);
  console.log(json , 'from test')
  return JSON.parse(json);
}
