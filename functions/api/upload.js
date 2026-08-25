export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    
    // 1. Verify Internal Password
    // Secure Way: Prioritize the password from Cloudflare KV (synced from Google Sheets)
    let expectedPassword = null;
    
    if (env.SETTINGS) {
      expectedPassword = await env.SETTINGS.get('upload_pwd');
    }
    
    // Fallback to Environment Variable if KV is not set up yet
    if (!expectedPassword) {
      expectedPassword = env.UPLOAD_PASSWORD;
    }

    if (!expectedPassword || body.password !== expectedPassword) {
      return Response.json({ success: false, error: "Unauthorized: Incorrect Internal Password" }, { status: 401 });
    }

    // 2. Prepare GitHub API details
    const githubToken = env.GITHUB_TOKEN;
    if (!githubToken) {
      return Response.json({ success: false, error: "Server Configuration Error: Missing GITHUB_TOKEN in Cloudflare Pages." }, { status: 500 });
    }
    
    // Ensure safe filename to prevent path traversal attacks
    const filename = String(body.filename || "").replace(/[^a-zA-Z0-9.\-_]/g, '');
    if (!filename) {
      return Response.json({ success: false, error: "Invalid filename" }, { status: 400 });
    }

    const targetPath = `assets/uploads/${filename}`;
    const repoOwner = "hikumar99";
    const repoName = "rpavault";
    
    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${targetPath}`;

    // 3. Commit to GitHub via API
    const githubResponse = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${githubToken}`,
        "Content-Type": "application/json",
        "User-Agent": "RPAVault-Internal-Uploader"
      },
      body: JSON.stringify({
        message: `Upload new internal image: ${filename}`,
        content: body.image, 
        branch: "main"       
      })
    });

    if (!githubResponse.ok) {
      const err = await githubResponse.text();
      return Response.json({ success: false, error: "GitHub API Error: " + err }, { status: githubResponse.status });
    }

    // 4. Return success
    return Response.json({ 
      success: true, 
      url: `https://rpavault.com/assets/uploads/${filename}`
    });

  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
