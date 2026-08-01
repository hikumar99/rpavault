export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const client_id = env.GITHUB_CLIENT_ID;
  
  if (!client_id) {
    return new Response("Missing GITHUB_CLIENT_ID environment variable on Cloudflare", { status: 500 });
  }
  
  const provider = url.searchParams.get("provider") || "github";
  const scope = url.searchParams.get("scope") || "repo";
  
  // Redirect to GitHub's authorization endpoint
  const redirect_uri = `${url.origin}/callback`;
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${client_id}&scope=${scope}&redirect_uri=${encodeURIComponent(redirect_uri)}`;
  
  return Response.redirect(githubAuthUrl, 302);
}
