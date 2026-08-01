export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  
  if (!code) {
    return new Response("Missing authorization code", { status: 400 });
  }
  
  const client_id = env.GITHUB_CLIENT_ID;
  const client_secret = env.GITHUB_CLIENT_SECRET;
  
  if (!client_id || !client_secret) {
    return new Response("Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET on Cloudflare", { status: 500 });
  }
  
  // Exchange code for Access Token
  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": "RPAVault-OAuth-Broker"
    },
    body: JSON.stringify({
      client_id,
      client_secret,
      code
    })
  });
  
  const tokenData = await tokenResponse.json();
  
  if (tokenData.error) {
    return new Response(`OAuth Error: ${tokenData.error_description || tokenData.error}`, { status: 400 });
  }
  
  const token = tokenData.access_token;
  
  // Script template to post message back to Decap CMS parent window
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Authorized</title>
    </head>
    <body>
      <p>Authorization successful! Redirecting you back to Content Manager...</p>
      <script>
        (function() {
          const token = ${JSON.stringify(token)};
          const provider = "github";
          
          function postMessage() {
            window.opener.postMessage(
              "authorization:" + provider + ":success:" + JSON.stringify({ token: token, provider: provider }),
              window.location.origin
            );
          }
          postMessage();
        })();
      </script>
    </body>
    </html>
  `;
  
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}
