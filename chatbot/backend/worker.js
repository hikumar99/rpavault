/**
 * ==========================================================================
 * RPAVault AI Career Counselor - Cloudflare Worker Edge Backend
 * Features:
 *  - KV Edge Caching (<15ms KB context read)
 *  - Gemini 2.5/1.5 Flash Structured JSON Output
 *  - Automated Cloudflare Geo & IP Diagnostics
 *  - Session-based Notion Logging (1 Page per Visitor Session)
 *  - Autonomous "⚠️ Needs Review" Flagging on Unhandled Queries
 *  - Lead Promotion to "🔥 Lead Captured"
 *  - Secret-Protected /sync Endpoint
 * ==========================================================================
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. CORS Preflight Handling
    if (request.method === "OPTIONS") {
      return handleCors(request, env);
    }

    // 2. Route Dispatcher
    try {
      if (url.pathname.endsWith("/api/chat") && request.method === "POST") {
        return await handleChat(request, env, ctx);
      }

      if (url.pathname.endsWith("/api/chat/lead") && request.method === "POST") {
        return await handleLead(request, env, ctx);
      }

      if (url.pathname.endsWith("/api/chat/sync") && request.method === "GET") {
        return await handleSync(request, env);
      }

      if (url.pathname.endsWith("/api/chat/models") && request.method === "GET") {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${env.GEMINI_API_KEY}`);
        const data = await res.json();
        return jsonResponse(data, 200, request, env);
      }

      return jsonResponse({ error: "Endpoint not found" }, 404, request, env);
    } catch (err) {
      console.error("Worker error:", err);
      return jsonResponse({ error: "Internal Server Error", details: err.message }, 500, request, env);
    }
  }
};

// ==========================================================================
// 1. CHAT HANDLER
// ==========================================================================
async function handleChat(request, env, ctx) {
  const body = await request.json();
  const userMessage = (body.message || "").trim();
  const sessionId = (body.sessionId || "anonymous_session").trim();
  const history = body.history || [];

  if (!userMessage) {
    return jsonResponse({ reply: "Please enter your question." }, 400, request, env);
  }

  // A. Extract Cloudflare Edge Geo & IP Diagnostics
  const ip = request.headers.get("cf-connecting-ip") || "Unknown IP";
  const city = request.cf?.city || "Unknown City";
  const region = request.cf?.region || "";
  const country = request.cf?.country || "Unknown Country";
  const locationLabel = `${city}${region ? ", " + region : ""}, ${country}`;

  // B. Retrieve Knowledge Base from Cloudflare KV (or self-heal from Notion)
  let kbContext = "";
  if (env.CHATBOT_KV) {
    kbContext = await env.CHATBOT_KV.get("KB_DATA");
  }

  if (!kbContext && env.NOTION_TOKEN && env.NOTION_DATABASE_ID) {
    // Self-heal: Fetch directly from Notion if KV is empty
    kbContext = await fetchNotionKB(env);
    if (env.CHATBOT_KV && kbContext) {
      ctx.waitUntil(env.CHATBOT_KV.put("KB_DATA", kbContext, { expirationTtl: 259200 }));
    }
  }

  // C. Query Gemini with Structured JSON Output
  const aiResult = await askGemini(userMessage, history, kbContext, env);

  // D. Asynchronously Log or Update the Session Page in Notion
  if (env.NOTION_TOKEN && env.NOTION_DATABASE_ID) {
    ctx.waitUntil(
      logSessionToNotion(env, {
        sessionId,
        userMessage,
        aiReply: aiResult.reply,
        status: aiResult.status,
        ip,
        locationLabel
      })
    );
  }

  // E. Return response to visitor
  return jsonResponse(
    {
      reply: aiResult.reply,
      status: aiResult.status,
      suggest_contact: aiResult.suggest_contact
    },
    200,
    request,
    env
  );
}

// ==========================================================================
// 2. LEAD CAPTURE HANDLER
// ==========================================================================
async function handleLead(request, env, ctx) {
  const body = await request.json();
  const sessionId = (body.sessionId || "").trim();
  const name = (body.name || "").trim();
  const phone = (body.phone || "").trim();
  const email = (body.email || "").trim();

  if (!sessionId || !name || !phone) {
    return jsonResponse({ error: "Missing required fields" }, 400, request, env);
  }

  const city = request.cf?.city || "";
  const country = request.cf?.country || "";
  const locationLabel = city && country ? `[${city}, ${country}]` : "";

  // Update Notion Session Page in the background
  if (env.NOTION_TOKEN && env.NOTION_DATABASE_ID) {
    ctx.waitUntil(
      updateNotionLead(env, {
        sessionId,
        name,
        phone,
        email,
        locationLabel
      })
    );
  }

  return jsonResponse({ success: true, message: "Lead captured successfully" }, 200, request, env);
}

// ==========================================================================
// 3. CACHE SYNC HANDLER (Protected by Admin Key)
// ==========================================================================
async function handleSync(request, env) {
  const url = new URL(request.url);
  const providedKey = url.searchParams.get("key");

  if (!env.ADMIN_SYNC_KEY || providedKey !== env.ADMIN_SYNC_KEY) {
    return jsonResponse({ error: "Unauthorized. Invalid or missing admin key." }, 401, request, env);
  }

  const freshKB = await fetchNotionKB(env);
  if (env.CHATBOT_KV) {
    await env.CHATBOT_KV.put("KB_DATA", freshKB, { expirationTtl: 259200 }); // 72 hours
  }

  return jsonResponse(
    {
      success: true,
      message: "Knowledge Base successfully refreshed into Cloudflare Workers KV!",
      timestamp: new Date().toISOString()
    },
    200,
    request,
    env
  );
}

// ==========================================================================
// 4. GEMINI REASONING ENGINE (Structured JSON)
// ==========================================================================
async function askGemini(userQuery, history, kbContext, env) {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      reply: "Our counseling system is undergoing quick maintenance. Please leave your WhatsApp number so an instructor can call you.",
      status: "UNKNOWN",
      suggest_contact: true
    };
  }

  const systemInstruction = `You are the empathetic, expert AI Career Counselor & Consultant for RPAVault.

ABOUT RPAVAULT:
RPAVault is more than an IT training institute: we are a full-scale partner for Enterprise Automations, IT Staffing & Consulting, and Professional Hands-on Upskilling (UiPath, Agentic AI, Cloud, DevOps, and Data Analytics).

KNOWLEDGE BASE CONTEXT:
${kbContext || "No KB loaded. Offer to connect the visitor with our senior advisory team."}

CONVERSATIONALIST GUIDELINES:
1. ACTIVE CONVERSATIONALIST (Keep Dialogue Flowing): Answer the user's specific query first with verified facts from the Knowledge Base. Keep responses natural and concise — do NOT repeat introductory taglines or company service lists in ongoing turns. Conclude with an engaging, friendly follow-up question to learn more about their situation (e.g. "Which background are you currently coming from?", "How long has your career gap been?", "Are you looking for weekday or weekend batches?").
2. EMPATHY & REASSURANCE: Reassure candidates from non-IT backgrounds (UiPath is low-code and visual) and those with career gaps (3+ live enterprise projects bridge resume gaps).
3. SOFT DOCUMENT OFFER (The Golden Nudge): When addressing career transitions, gaps, fees, or course roadmaps, politely offer:
"If you are interested, we can provide detailed information and the roadmap document directly to your WhatsApp or email ID. Would you like to get that document?"
4. RESPECT NAME PREFERENCE: If the user has not provided a name, address them politely as "you" and NEVER ask for their name again. If a name is provided, address them warmly by name.
5. CONTACT TRIGGER: Set "suggest_contact" to true ONLY if the visitor agrees (e.g. says "yes", "sure", "send it", "share document") or explicitly asks for a callback, syllabus, or document.`;

  // Format message history
  const contents = [];
  if (history && history.length) {
    for (const h of history) {
      contents.push({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.text }]
      });
    }
  }
  // Add latest message
  contents.push({
    role: "user",
    parts: [{ text: userQuery }]
  });

  const payload = {
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    contents: contents,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          reply: { type: "STRING" },
          status: { type: "STRING", enum: ["ANSWERED", "UNKNOWN"] },
          suggest_contact: { type: "BOOLEAN" }
        },
        required: ["reply", "status", "suggest_contact"]
      }
    }
  };

  const endpoints = [
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`
  ];

  let lastError = null;
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (res.ok && json.candidates?.[0]?.content?.parts?.[0]?.text) {
        return JSON.parse(json.candidates[0].content.parts[0].text);
      }
      if (json.error) {
        lastError = json.error.message;
      }
    } catch (err) {
      lastError = err.message;
    }
  }

  // Automatic Groq Fallback Backup
  if (env.GROQ_API_KEY) {
    const groqResult = await askGroq(userQuery, history, kbContext, env, systemInstruction);
    if (groqResult) {
      return groqResult;
    }
  }

  if (lastError) {
    console.error("Gemini API error:", lastError);
    return {
      reply: `Notice: ${lastError}`,
      status: "UNKNOWN",
      suggest_contact: true
    };
  }

  return {
    reply: "I'd be glad to help you with that! Would you like to share your WhatsApp number so our instructor can review your profile directly?",
    status: "UNKNOWN",
    suggest_contact: true
  };
}

// Groq Llama 3.3 Backup Engine
async function askGroq(userQuery, history, kbContext, env, systemInstruction) {
  if (!env.GROQ_API_KEY) return null;
  const endpoint = "https://api.groq.com/openai/v1/chat/completions";

  const messages = [
    {
      role: "system",
      content: systemInstruction + "\nYou MUST output valid JSON only adhering to this structure: {\"reply\": \"string\", \"status\": \"ANSWERED\"|\"UNKNOWN\", \"suggest_contact\": boolean}"
    }
  ];

  if (history && history.length) {
    for (const h of history) {
      messages.push({
        role: h.role === "user" ? "user" : "assistant",
        content: h.text
      });
    }
  }

  messages.push({
    role: "user",
    content: userQuery
  });

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: messages,
        response_format: { type: "json_object" },
        temperature: 0.2
      })
    });

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    if (content) {
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Groq fallback error:", err);
  }
  return null;
}

// ==========================================================================
// 5. NOTION API INTEGRATION (Session-Based Logging & KV Sync)
// ==========================================================================

// Fetch Approved Knowledge Base rows from Notion
async function fetchNotionKB(env) {
  const url = `https://api.notion.com/v1/databases/${env.NOTION_DATABASE_ID}/query`;
  const payload = {
    filter: {
      and: [
        { property: "Record Type", select: { equals: "Knowledge Base" } },
        { property: "Status", status: { equals: "Approved (Active)" } }
      ]
    },
    page_size: 100
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (!json.results || !json.results.length) return "";

    return json.results
      .map((page) => {
        const q = page.properties["Topic / Visitor Query"]?.title?.[0]?.plain_text || "";
        const a = page.properties["Answer / Key Insight"]?.rich_text?.[0]?.plain_text || "";
        const cat = page.properties["Category"]?.select?.name || "General";
        return `[Category: ${cat}]\nQ: ${q}\nA: ${a}`;
      })
      .join("\n\n---\n\n");
  } catch (err) {
    console.error("Error fetching Notion KB:", err);
    return "";
  }
}

// Log or Append interaction to the visitor's Notion Session Page
async function logSessionToNotion(env, { sessionId, userMessage, aiReply, status, ip, locationLabel }) {
  const kvKey = `session_notion_id:${sessionId}`;
  let pageId = env.CHATBOT_KV ? await env.CHATBOT_KV.get(kvKey) : null;

  const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (!pageId) {
    // 1. Create a NEW Session Page in Notion
    const createUrl = "https://api.notion.com/v1/pages";
    const title = `Session - ${locationLabel} - ${userMessage.substring(0, 35)}...`;

    const createPayload = {
      parent: { database_id: env.NOTION_DATABASE_ID },
      properties: {
        "Topic / Visitor Query": {
          title: [{ text: { content: title } }]
        },
        "Record Type": {
          select: { name: "Visitor Session" }
        },
        Status: {
          status: { name: status === "UNKNOWN" ? "⚠️ Needs Review" : "Auto-Answered" }
        },
        "Session ID": {
          rich_text: [{ text: { content: sessionId } }]
        },
        "Visitor Name": {
          rich_text: [{ text: { content: `Anonymous (${locationLabel})` } }]
        }
      },
      children: [
        {
          object: "block",
          type: "callout",
          callout: {
            icon: { type: "emoji", emoji: "📍" },
            rich_text: [{ type: "text", text: { content: `Visitor Session Started: ${locationLabel} (IP: ${ip})` } }]
          }
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              { type: "text", text: { content: `[${timestamp}] Visitor: ` }, annotations: { bold: true } },
              { type: "text", text: { content: userMessage } }
            ]
          }
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              { type: "text", text: { content: `[${timestamp}] Counselor: ` }, annotations: { bold: true, color: "blue" } },
              { type: "text", text: { content: aiReply } }
            ]
          }
        }
      ]
    };

    try {
      const res = await fetch(createUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(createPayload)
      });
      const data = await res.json();
      if (data.id && env.CHATBOT_KV) {
        await env.CHATBOT_KV.put(kvKey, data.id, { expirationTtl: 86400 }); // Cache page ID for 24h
      }
    } catch (err) {
      console.error("Failed creating Notion session page:", err);
    }
  } else {
    // 2. Append to EXISTING Session Page
    const appendUrl = `https://api.notion.com/v1/blocks/${pageId}/children`;
    const appendPayload = {
      children: [
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              { type: "text", text: { content: `[${timestamp}] Visitor: ` }, annotations: { bold: true } },
              { type: "text", text: { content: userMessage } }
            ]
          }
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              { type: "text", text: { content: `[${timestamp}] Counselor: ` }, annotations: { bold: true, color: "blue" } },
              { type: "text", text: { content: aiReply } }
            ]
          }
        }
      ]
    };

    try {
      await fetch(appendUrl, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${env.NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(appendPayload)
      });

      // If status is UNKNOWN, elevate existing page status to ⚠️ Needs Review
      if (status === "UNKNOWN") {
        await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${env.NOTION_TOKEN}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            properties: {
              Status: { status: { name: "⚠️ Needs Review" } }
            }
          })
        });
      }
    } catch (err) {
      console.error("Failed appending to Notion session page:", err);
    }
  }
}

// Update Notion Session Page when visitor leaves their lead details
async function updateNotionLead(env, { sessionId, name, phone, email, locationLabel }) {
  const kvKey = `session_notion_id:${sessionId}`;
  const pageId = env.CHATBOT_KV ? await env.CHATBOT_KV.get(kvKey) : null;
  if (!pageId) return;

  try {
    // 1. Update properties to Lead Captured & set contact info
    await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${env.NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        properties: {
          "Topic / Visitor Query": {
            title: [{ text: { content: `🔥 Lead: ${name} (${phone}) ${locationLabel}` } }]
          },
          Status: {
            status: { name: "🔥 Lead Captured" }
          },
          "Visitor Name": {
            rich_text: [{ text: { content: name } }]
          },
          "WhatsApp / Phone": {
            phone_number: phone
          },
          "Email": {
            email: email
          }
        }
      })
    });

    // 2. Append prominent lead banner block
    await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${env.NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        children: [
          {
            object: "block",
            type: "callout",
            callout: {
              icon: { type: "emoji", emoji: "🔥" },
              rich_text: [
                {
                  type: "text",
                  text: {
                    content: `LEAD CAPTURED: ${name} | WhatsApp: ${phone} | Email: ${email}`
                  }
                }
              ]
            }
          }
        ]
      })
    });
  } catch (err) {
    console.error("Failed updating Notion lead:", err);
  }
}

// ==========================================================================
// 6. CORS & HELPER UTILITIES
// ==========================================================================
function getCorsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "*";

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
  };
}

function handleCors(request, env) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request, env)
  });
}

function jsonResponse(data, status = 200, request, env) {
  const headers = Object.assign(
    {
      "Content-Type": "application/json"
    },
    getCorsHeaders(request, env)
  );

  return new Response(JSON.stringify(data), {
    status: status,
    headers: headers
  });
}
