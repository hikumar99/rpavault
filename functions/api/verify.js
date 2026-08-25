export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const submittedPwd = (body.password || "").trim();
    
    let expectedPassword = null;
    let sourceInfo = "No password bound";
    let kvValueFound = false;
    
    // Check KV first (Google Sheet sync)
    if (env.SETTINGS) {
      const kvVal = await env.SETTINGS.get('upload_pwd');
      if (kvVal !== null) {
        kvValueFound = true;
      }
      if (kvVal && kvVal.trim() !== '') {
        expectedPassword = kvVal.trim();
        sourceInfo = "Google Sheet (KV)";
      }
    }
    
    // Fallback to Environment Variable
    if (!expectedPassword && env.UPLOAD_PASSWORD) {
      expectedPassword = env.UPLOAD_PASSWORD.trim();
      sourceInfo = "Cloudflare Env Var";
    }

    if (!expectedPassword || submittedPwd !== expectedPassword) {
      let debugMsg = `Checked: ${sourceInfo}`;
      if (!env.SETTINGS) debugMsg += " | KV not bound";
      else if (!kvValueFound) debugMsg += " | 'upload_pwd' key not found in KV";
      
      return Response.json({ success: false, error: "Wrong pwd, contact kumar", debug: debugMsg }, { status: 401 });
    }
    
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
