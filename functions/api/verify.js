export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const submittedPwd = (body.password || "").trim();
    
    let expectedPassword = null;
    
    // Check KV first (Google Sheet sync)
    if (env.SETTINGS) {
      const kvVal = await env.SETTINGS.get('upload_pwd');
      if (kvVal && kvVal.trim() !== '') {
        expectedPassword = kvVal.trim();
      }
    }
    
    // Fallback to Environment Variable
    if (!expectedPassword && env.UPLOAD_PASSWORD) {
      expectedPassword = env.UPLOAD_PASSWORD.trim();
    }

    if (!expectedPassword || submittedPwd !== expectedPassword) {
      return Response.json({ success: false, error: "Wrong pwd, contact kumar" }, { status: 401 });
    }
    
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
