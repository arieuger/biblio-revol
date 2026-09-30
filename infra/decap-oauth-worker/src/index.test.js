import { afterEach, describe, expect, it, vi } from 'vitest';
import worker from './index.js';
const env = { GITHUB_CLIENT_ID: 'test-client', GITHUB_CLIENT_SECRET: 'test-secret', ALLOWED_ORIGIN: 'https://arieuger.github.io' };
afterEach(() => vi.unstubAllGlobals());
describe('Decap GitHub OAuth', () => {
  it('sets a secure state cookie and the matching GitHub callback', async () => {
    const response = await worker.fetch(new Request('https://auth.example/auth'), env);
    expect(response.status).toBe(302);
    const location = new URL(response.headers.get('location'));
    expect(location.searchParams.get('redirect_uri')).toBe('https://auth.example/callback');
    expect(response.headers.get('set-cookie')).toContain(location.searchParams.get('state'));
    expect(response.headers.get('set-cookie')).toContain('HttpOnly; Secure; SameSite=Lax');
  });
  it('rejects missing or mismatched state before exchanging a code', async () => {
    const mock = vi.fn(); vi.stubGlobal('fetch', mock);
    const response = await worker.fetch(new Request('https://auth.example/callback?code=code&state=wrong', { headers: { cookie: '__Host-decap-oauth-state=expected' } }), env);
    expect(response.status).toBe(400); expect(mock).not.toHaveBeenCalled();
  });
  it('uses the standard handshake restricted to the configured opener', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ access_token: 'test-token' })));
    const response = await worker.fetch(new Request('https://auth.example/callback?code=code&state=expected', { headers: { cookie: '__Host-decap-oauth-state=expected' } }), env);
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain('authorizing:github');
    expect(html).toContain('event.source !== window.opener');
    expect(html).toContain('https://arieuger.github.io');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
  });
  it('fails clearly if credentials are missing', async () => {
    expect((await worker.fetch(new Request('https://auth.example/auth'), {})).status).toBe(503);
  });
});
