// FEROX LVIV — GitHub OAuth proxy for Sveltia/Decap CMS
// Deploy this as a separate Cloudflare Worker (NOT the main site).
//
// Required environment variables (set as secrets in Cloudflare):
//   GITHUB_CLIENT_ID     — from GitHub OAuth App
//   GITHUB_CLIENT_SECRET — from GitHub OAuth App
//
// Endpoints:
//   GET /oauth/authorize  — starts OAuth flow, redirects to GitHub
//   GET /callback         — receives GitHub callback, exchanges code for token

const ALLOWED_ORIGINS = [
  'https://feroxlviv-site.prokopiv-andriy99.workers.dev',
  'https://feroxlviv.pages.dev',
  'https://feroxlviv.netlify.app',
  'https://feroxlviv.ua',
  'https://www.feroxlviv.ua'
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/oauth/authorize') {
      return handleAuthorize(url, env);
    }
    if (url.pathname === '/callback') {
      return handleCallback(url, env);
    }
    return new Response('FEROX LVIV CMS Auth Service', { status: 200 });
  }
};

function handleAuthorize(url, env) {
  const provider = url.searchParams.get('provider') || 'github';
  const scope = url.searchParams.get('scope') || 'repo,user';
  const site_id = url.searchParams.get('site_id') || '';

  if (provider !== 'github') {
    return new Response('Unsupported provider', { status: 400 });
  }

  const githubAuth = new URL('https://github.com/login/oauth/authorize');
  githubAuth.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  githubAuth.searchParams.set('scope', scope);
  githubAuth.searchParams.set('state', site_id);

  return Response.redirect(githubAuth.toString(), 302);
}

async function handleCallback(url, env) {
  const code = url.searchParams.get('code');
  if (!code) return new Response('Missing code', { status: 400 });

  // Exchange code for access token
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code: code
    })
  });

  const tokenJson = await tokenRes.json();

  if (tokenJson.error || !tokenJson.access_token) {
    return new Response(`OAuth error: ${tokenJson.error_description || tokenJson.error || 'No token'}`, { status: 400 });
  }

  // Build response page that uses postMessage to send token to opener (CMS)
  const content = {
    token: tokenJson.access_token,
    provider: 'github'
  };

  const html = `<!DOCTYPE html>
<html>
<head><title>Авторизація…</title></head>
<body>
<script>
  (function() {
    function postResult(status, message) {
      var msg = 'authorization:github:' + status + ':' + JSON.stringify(message);
      if (window.opener) {
        window.opener.postMessage(msg, '*');
      }
      setTimeout(function() { window.close(); }, 1000);
    }
    postResult('success', ${JSON.stringify(content)});
  })();
</script>
<p style="font-family:sans-serif;text-align:center;margin-top:40px">Авторизація успішна. Зачекайте на закриття вікна…</p>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
