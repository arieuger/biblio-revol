const cookieName = '__Host-decap-oauth-state';
const clearCookie = `${cookieName}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
const safeJson = value => JSON.stringify(value).replace(/</g, '\\u003c');
const html = (body, status = 200, headers = {}) => new Response(body, {
  status,
  headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'referrer-policy': 'no-referrer', 'x-content-type-options': 'nosniff', ...headers },
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== 'GET') return new Response('Method not allowed', { status: 405 });
    if (url.pathname === '/health') return Response.json({ service: 'revolteira-decap-oauth', configured: Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET && env.ALLOWED_ORIGIN) });
    if (!['/auth', '/callback'].includes(url.pathname)) return new Response('Not found', { status: 404 });
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.ALLOWED_ORIGIN) return html('<h1>Falta configurar a aplicación OAuth de GitHub.</h1>', 503);
    let allowedOrigin;
    try {
      const allowed = new URL(env.ALLOWED_ORIGIN);
      if (allowed.protocol !== 'https:' || allowed.origin !== env.ALLOWED_ORIGIN) throw new Error('origin');
      allowedOrigin = allowed.origin;
    } catch { return html('<h1>O dominio autorizado non é válido.</h1>', 503); }
    const redirectUri = `${url.origin}/callback`;
    if (url.pathname === '/auth') {
      const state = crypto.randomUUID();
      const query = new URLSearchParams({ client_id: env.GITHUB_CLIENT_ID, redirect_uri: redirectUri, scope: env.GITHUB_SCOPE || 'repo', state });
      return new Response(null, { status: 302, headers: {
        location: `https://github.com/login/oauth/authorize?${query}`,
        'set-cookie': `${cookieName}=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
        'cache-control': 'no-store',
      } });
    }
    const state = url.searchParams.get('state');
    const cookieState = (request.headers.get('cookie') || '').split(';').map(value => value.trim()).find(value => value.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
    if (!state || !cookieState || state !== cookieState) return html('<h1>A sesión OAuth caducou ou non é válida. Volve iniciar sesión.</h1>', 400, { 'set-cookie': clearCookie });
    const code = url.searchParams.get('code');
    if (!code) return html('<h1>Non se autorizou o acceso a GitHub.</h1>', 400, { 'set-cookie': clearCookie });
    try {
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST', headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code, redirect_uri: redirectUri }),
      });
      const result = await response.json();
      if (!response.ok || typeof result.access_token !== 'string') throw new Error('oauth');
      const message = `authorization:github:success:${JSON.stringify({ token: result.access_token, provider: 'github' })}`;
      // Decap waits for the authorization handshake before accepting the token.
      // Only the configured opener can receive it; never store or log the token.
      return html(`<!doctype html><meta charset="utf-8"><title>Revolteira — GitHub</title><p>Conectando co panel de Revolteira…</p><script>
        const origin = ${safeJson(allowedOrigin)};
        function receive(event) {
          if (event.origin !== origin || event.source !== window.opener || event.data !== 'authorizing:github') return;
          window.removeEventListener('message', receive);
          window.opener.postMessage(${safeJson(message)}, origin);
          setTimeout(() => window.close(), 500);
        }
        window.addEventListener('message', receive);
        if (window.opener) window.opener.postMessage('authorizing:github', origin);
        else document.querySelector('p').textContent = 'Abre o inicio de sesión desde o panel de Decap.';
      </script>`, 200, { 'set-cookie': clearCookie });
    } catch { return html('<h1>Non se puido completar o acceso a GitHub. Téntao de novo.</h1>', 502, { 'set-cookie': clearCookie }); }
  },
};
