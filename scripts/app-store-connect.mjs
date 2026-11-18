import { createPrivateKey, sign } from 'node:crypto';

const root = 'https://api.appstoreconnect.apple.com';
let cachedToken;

function authorization() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.refreshAt > now) return cachedToken.value;
  const key = process.env.APP_STORE_CONNECT_PRIVATE_KEY;
  const keyId = process.env.APP_STORE_CONNECT_KEY_IDENTIFIER;
  const issuer = process.env.APP_STORE_CONNECT_ISSUER_ID;
  if (!key || !keyId || !issuer) throw new Error('Missing App Store Connect credentials');
  const base64url = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const header = base64url({ alg: 'ES256', kid: keyId, typ: 'JWT' });
  const claims = base64url({ iss: issuer, iat: now, exp: now + 900, aud: 'appstoreconnect-v1' });
  const payload = `${header}.${claims}`;
  const signature = sign('sha256', Buffer.from(payload), {
    key: createPrivateKey(key.replace(/\\n/g, '\n')),
    dsaEncoding: 'ieee-p1363',
  });
  cachedToken = { value: `Bearer ${payload}.${signature.toString('base64url')}`, refreshAt: now + 600 };
  return cachedToken.value;
}

export async function list(path) {
  const records = [];
  while (path) {
    const url = new URL(path, root);
    if (url.origin !== root) throw new Error('Unexpected App Store Connect API origin');
    const headers = { Authorization: authorization() };
    const response = await fetch(url, { headers, redirect: 'error', signal: AbortSignal.timeout(25_000) });
    if (!response.ok) {
      const error = new Error(`App Store Connect request failed: ${response.status} ${url.pathname}`);
      error.status = response.status;
      throw error;
    }
    const page = await response.json();
    records.push(...page.data);
    path = page.links?.next;
  }
  return records;
}

export async function findApp(bundleId) {
  const query = new URLSearchParams({ 'filter[bundleId]': bundleId, limit: '2' });
  const apps = await list(`/v1/apps?${query}`);
  if (apps.length !== 1) throw new Error(`Expected one app for ${bundleId}, found ${apps.length}`);
  return apps[0].id;
}
