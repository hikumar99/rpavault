export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const submittedPwd = (body.password || "").trim();

    // 1. Verify Admin Password
    let expectedPassword = null;
    if (env.SETTINGS) {
      const kvVal = await env.SETTINGS.get('upload_pwd');
      if (kvVal && kvVal.trim() !== '') {
        expectedPassword = kvVal.trim();
      }
    }
    if (!expectedPassword && env.UPLOAD_PASSWORD) {
      expectedPassword = env.UPLOAD_PASSWORD.trim();
    }

    if (!expectedPassword || submittedPwd !== expectedPassword) {
      return Response.json({ success: false, error: "Incorrect admin password." }, { status: 401 });
    }

    // 2. Validate payload
    const batchKey = (body.batchKey || "").trim();
    const courseName = (body.course || "").trim();
    const batchName = (body.batch || "").trim();
    const batchData = body.data;

    if (!batchKey || !batchData) {
      return Response.json({ success: false, error: "Missing batchKey or batch data." }, { status: 400 });
    }

    // 3. Prepare GitHub API details
    const githubToken = env.GITHUB_TOKEN;
    if (!githubToken) {
      return Response.json({ success: false, error: "Server Configuration Error: Missing GITHUB_TOKEN in Cloudflare Pages." }, { status: 500 });
    }

    const repoOwner = "hikumar99";
    const repoName = "rpavault";
    const targetPath = "assets/data/frozen_batches.json";
    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${targetPath}`;

    // 4. Fetch existing frozen_batches.json to get current SHA and content
    let existingStore = {};
    let fileSha = null;

    try {
      const getRes = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${githubToken}`,
          "User-Agent": "RPAVault-Batch-Freezer"
        }
      });

      if (getRes.ok) {
        const fileInfo = await getRes.json();
        fileSha = fileInfo.sha;
        if (fileInfo.content) {
          // GitHub returns base64 content
          const decoded = atob(fileInfo.content.replace(/\s+/g, ''));
          existingStore = JSON.parse(decoded);
        }
      }
    } catch (_) {}

    // 5. Merge new frozen batch into store
    existingStore[batchKey] = {
      frozen: true,
      frozenAt: new Date().toISOString(),
      course: courseName,
      batch: batchName,
      data: batchData
    };

    const updatedJsonStr = JSON.stringify(existingStore, null, 2);
    // Base64 encode for GitHub API (supporting UTF-8 characters)
    const updatedBase64 = btoa(unescape(encodeURIComponent(updatedJsonStr)));

    // 6. Commit to GitHub via API
    const putBody = {
      message: `Freeze batch archive: ${courseName} - ${batchName}`,
      content: updatedBase64,
      branch: "main"
    };
    if (fileSha) {
      putBody.sha = fileSha;
    }

    const githubResponse = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${githubToken}`,
        "Content-Type": "application/json",
        "User-Agent": "RPAVault-Batch-Freezer"
      },
      body: JSON.stringify(putBody)
    });

    if (!githubResponse.ok) {
      const errText = await githubResponse.text();
      return Response.json({ success: false, error: "GitHub API Error: " + errText }, { status: githubResponse.status });
    }

    return Response.json({
      success: true,
      message: `Batch "${batchName}" has been successfully saved to the website repository! Cloudflare Pages is now deploying it.`
    });

  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
