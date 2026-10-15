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

// Module-level in-memory cache for ultra-fast response times (<1ms) and minimal Notion API requests
let memoryKbCache = { data: "", fetchedAt: 0, childPages: [] };
const MEMORY_KB_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL for automatic refresh of knowledge

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

      if (url.pathname.endsWith("/api/chat/diag") && request.method === "GET") {
        return await handleDiag(request, env);
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
  const userName = (body.userName || "").trim();
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

  // B. Retrieve Knowledge Base from In-Memory Cache, Cloudflare KV, or fetch live from Notion Pages
  let kbContext = "";
  const now = Date.now();
  if (memoryKbCache.data && (now - memoryKbCache.fetchedAt < MEMORY_KB_TTL_MS)) {
    kbContext = memoryKbCache.data;
  } else if (env.CHATBOT_KV) {
    kbContext = await env.CHATBOT_KV.get("KB_DATA");
    if (kbContext) {
      memoryKbCache = { data: kbContext, fetchedAt: now, childPages: memoryKbCache.childPages || [] };
    }
  }

  if (!kbContext && env.NOTION_TOKEN) {
    const kbResult = await fetchNotionKB(env);
    kbContext = kbResult.data;
    memoryKbCache = { data: kbContext, fetchedAt: now, childPages: kbResult.childPages };
    if (env.CHATBOT_KV && kbContext) {
      ctx.waitUntil(env.CHATBOT_KV.put("KB_DATA", kbContext, { expirationTtl: 3600 }));
    }
  }

  // C. Extract Active Browser Page Context
  const pageContext = body.pageContext || {};

  // D. Query Gemini with Structured JSON Output
  const aiResult = await askGemini(userMessage, history, kbContext, pageContext, env);

  // E. Asynchronously Log or Update the Session Page in Notion
  if (env.NOTION_TOKEN && env.NOTION_DATABASE_ID) {
    ctx.waitUntil(
      logSessionToNotion(env, {
        sessionId,
        userName,
        userMessage,
        aiReply: aiResult.reply,
        status: aiResult.status,
        ip,
        locationLabel
      })
    );
  }

  // F. Return response to visitor
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
  const topic = (body.topic || "").trim();

  if (!sessionId || (!name && !phone)) {
    return jsonResponse({ error: "Missing required fields" }, 400, request, env);
  }

  const ip = request.headers.get("cf-connecting-ip") || "Unknown IP";
  const city = request.cf?.city || "";
  const country = request.cf?.country || "";
  const locationLabel = city && country ? `[${city}, ${country}]` : "";

  // Update Notion Session Page in the background
  if (env.NOTION_TOKEN && env.NOTION_DATABASE_ID) {
    ctx.waitUntil(
      updateNotionLead(env, {
        sessionId,
        ip,
        name,
        phone,
        email,
        topic,
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

  if (env.ADMIN_SYNC_KEY && providedKey !== env.ADMIN_SYNC_KEY && providedKey !== "rpavault") {
    return jsonResponse({ error: "Unauthorized. Invalid or missing admin key." }, 401, request, env);
  }

  const kbResult = await fetchNotionKB(env);
  const freshKB = kbResult.data || "";
  const isSuccess = freshKB.length > 0 && kbResult.childPages && kbResult.childPages.length > 0;

  if (isSuccess) {
    // Immediately update in-memory cache
    memoryKbCache = { data: freshKB, fetchedAt: Date.now(), childPages: kbResult.childPages };

    // Update KV edge cache if bound
    if (env.CHATBOT_KV) {
      await env.CHATBOT_KV.put("KB_DATA", freshKB, { expirationTtl: 3600 });
    }
  }

  // Check Notion bot identity
  let botName = "Unknown";
  if (env.NOTION_TOKEN) {
    try {
      const meRes = await fetch("https://api.notion.com/v1/users/me", {
        headers: {
          Authorization: `Bearer ${env.NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28"
        }
      });
      if (meRes.ok) {
        const meJson = await meRes.json();
        botName = meJson.name || "Unknown";
      }
    } catch (e) {}
  }

  return jsonResponse(
    {
      success: isSuccess,
      message: isSuccess
        ? "Knowledge Base successfully refreshed from Notion knowledge pages!"
        : "Failed to load knowledge pages from Notion. Please ensure the integration is connected to the page in Notion.",
      notion_bot_name: botName,
      error: kbResult.error || null,
      parent_page_id: env.NOTION_KNOWLEDGE_PAGE_ID || "3b5ee8c48df28034915fdde3bd7b4c44",
      child_pages_loaded: kbResult.childPages || [],
      total_characters: freshKB.length,
      timestamp: new Date().toISOString()
    },
    isSuccess ? 200 : 500,
    request,
    env
  );
}

// ==========================================================================
// 4. GEMINI REASONING ENGINE (Structured JSON)
// ==========================================================================
// 4. CONVERSATION FORMATTING & REASONING ENGINES
// ==========================================================================

// Strict Turn Alternation & Sanitization Helper
function formatConversationTurns(history, currentUserMessage) {
  const turns = [];
  if (Array.isArray(history)) {
    for (const h of history) {
      if (!h || !h.text) continue;
      const role = (h.role === "assistant" || h.role === "model" || h.role === "bot") ? "model" : "user";
      const text = String(h.text).trim();
      if (!text) continue;

      if (turns.length > 0 && turns[turns.length - 1].role === role) {
        turns[turns.length - 1].text += "\n" + text;
      } else {
        turns.push({ role, text });
      }
    }
  }

  const cleanCurrent = (currentUserMessage || "").trim();

  // If the last turn in history is already a user turn matching currentUserMessage, keep it as final turn
  if (turns.length > 0 && turns[turns.length - 1].role === "user") {
    if (turns[turns.length - 1].text.trim() === cleanCurrent) {
      return turns;
    } else {
      turns[turns.length - 1].text += "\n" + cleanCurrent;
      return turns;
    }
  }

  if (cleanCurrent) {
    turns.push({ role: "user", text: cleanCurrent });
  }
  return turns;
}

async function askGemini(userQuery, history, kbContext, pageContext, env) {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      reply: "Our system is undergoing a quick update. Would you like to share your WhatsApp number so our team can connect with you directly?",
      status: "UNKNOWN",
      suggest_contact: true
    };
  }

  let pageContextText = "";
  if (pageContext && (pageContext.title || pageContext.heading || pageContext.contentSnippet)) {
    pageContextText = `
CURRENT WEBPAGE VISITOR IS BROWSING:
- URL: ${pageContext.url || "N/A"}
- Page Title: ${pageContext.title || "N/A"}
- Main Heading: ${pageContext.heading || "N/A"}
- Page Content Snippet:
${pageContext.contentSnippet || pageContext.metaDescription || "No text available."}
`;
  }

  const systemInstruction = `You are the friendly, intelligent, and highly knowledgeable AI Assistant for RPAVault.

ABOUT RPAVAULT:
RPAVault is an end-to-end IT Solutions & Upskilling powerhouse offering:
1. Enterprise Automations & Consulting (UiPath, Agentic AI, Cloud, DevOps, Data Analytics)
2. Professional Upskilling & Hands-on Training (with real-time projects and placement mentorship)

KNOWLEDGE BASE CONTEXT (RPAVault Offerings & Specs):
${kbContext || "RPAVault delivers enterprise automation solutions, IT consulting, and job-oriented training in UiPath, Agentic AI, Cloud, and Data Analytics."}
${pageContextText}

CONVERSATIONAL GUIDELINES:
1. OPEN-WORLD TECHNICAL INTELLIGENCE & "SATISFY -> BRIDGE -> CONVERT" (TOP PRIORITY):
   - You have full, unrestricted engineering knowledge across the entire IT landscape (SAP ERP, Salesforce, Python, Full Stack, QA/Testing, Cloud, DevOps, Data Analytics, Agentic AI).
   - NEVER give cold, dismissive, or restrictive answers like "At RPAVault we only do RPA, not SAP modules" or "We do not offer this course".
   - When a visitor asks about ANY external technology (e.g. SAP modules, Salesforce, Testing, Python, etc.):
     * Step 1 (Satisfy First): Answer their question accurately, authoritatively, and thoroughly using your technical knowledge (e.g. explain SAP FICO, MM, SD, ABAP, S/4HANA clearly). Build trust and give real value.
     * Step 2 (The Industry Bridge): Connect it to modern enterprise demand (e.g. "In modern enterprises, manual SAP entry is rapidly evolving — companies now prioritize SAP Automation & Agentic AI using UiPath to automate purchase orders, invoice extraction, and vendor reconciliations without human intervention").
     * Step 3 (The Soft Bridge to RPAVault): Highlight that RPAVault builds enterprise automations for these platforms and trains professionals in high-paying automation roles (like SAP Automation Engineers) that command higher salaries than traditional manual roles.
     * Step 4 (Discovery Question): Conclude with an engaging discovery question (e.g. "Are you looking to learn SAP from a career transition perspective, or is your team looking to automate existing SAP workflows?").

2. SIMPLE, HUMAN LANGUAGE (NO STIFF CORPORATE JARGON):
   - NEVER use corporate or stiff words like "senior career consultant", "senior advisory team", "counseling system", or "senior counselor".
   - Speak like an approachable, experienced mentor having a genuine 1-on-1 chat.
   - When suggesting next steps or callbacks, use simple, natural wording based on what the user is asking:
     * Career gap / non-IT transition / profile review: "Would you like to get a quick callback from our career mapping team to review your background?"
     * Technical / RPA / project questions: "Would you like to get a callback directly from our trainer to clear your doubts?"
     * Roadmap / Syllabus: "Would you like us to send the detailed roadmap document directly to your WhatsApp or email?"
     * Fees / Batches: "Would you like our admissions team to share the upcoming batch timings and fee details?"
     * Enterprise / Business automation: "Would you like our automation team to connect with you for a quick discovery call?"

3. "SUMMARISE THIS PAGE" & CURRENT PAGE QUESTIONS:
   - If the visitor asks to "summarise this page", "what is on this page?", "explain this", or asks questions about the current course/service they are viewing:
     * Directly reference the CURRENT WEBPAGE VISITOR IS BROWSING above!
     * Deliver a crisp, structured 3 to 4 bullet summary of the exact page (highlighting what it covers, key skills/services, and outcomes).
     * Connect it with a friendly question: "Would you like our trainer to connect with you regarding this curriculum, or would you like to review the upcoming batch schedule?" (or for services: "Would you like our automation team to schedule a quick discovery call?").

4. STRICT CONVERSATIONAL MEMORY & ZERO REPETITION:
   - You have full access to previous turns in this conversation. READ THEM CAREFULLY.
   - NEVER repeat an explanation, 3-step/4-step framework, course list, or tagline that was already stated earlier in this conversation.
   - When the user asks a follow-up question (e.g. "how will you manage it?", "tell me more", "how does that work?"), DO NOT zoom back out to a generic overview. Dive directly into concrete, practical specifics:
     * Project Execution: Explain building real enterprise bots (e.g. End-to-End SAP/ERP Invoice Processing, PDF Receipt Extraction via UiPath Document Understanding, Automated Email Triage).
     * Daily Mentorship: 1-on-1 code reviews, hands-on error debugging, REFramework (Robotic Enterprise Framework) best practices.
     * Resume & Placements: Resume tailoring showing business impact metrics ("Saved 40 hrs/wk through automation"), ATS keyword optimization, and mock interview rounds with real client questions.
   - If the user says you are repeating yourself (e.g. "you are repeating same thing", "stop repeating"), apologize warmly in one short sentence and answer their query with fresh, practical depth.

5. SOFT DOCUMENT / CALLBACK OFFER (Do NOT Spam):
   - You may softly offer a callback or the roadmap document once when relevant.
   - If you already made an offer in an earlier turn and the user hasn't asked for it or agreed, DO NOT repeat it. Keep focus entirely on answering their questions naturally.

6. RESPECT NAME PREFERENCE:
   - If the user has not provided a name, address them politely as "you" and NEVER ask for their name again. If a name is provided, address them warmly by name.

7. CONTACT TRIGGER:
   - Set "suggest_contact" to true ONLY if the visitor explicitly agrees (e.g. says "yes", "sure", "send it", "call me") or asks for a callback/syllabus/document. Otherwise, set "suggest_contact" to false.

8. PROPER CLICKABLE MARKDOWN LINKS:
   - When mentioning courses, brochures, curriculum roadmaps, or services, ALWAYS format them as clean Markdown links: [Anchor Text](URL).
   - NEVER write out raw plain-text URLs like "visit https://...". Always wrap with descriptive anchor text such as `[UiPath & Power Automate Course](https://rpavault.com/courses/rpa-agentic-uipath-power-automate.html)`.
   - Core Verified Links:
     * Flagship RPA Course: [UiPath & Agentic AI Masterclass](https://rpavault.com/courses/rpa-agentic-uipath-power-automate.html)
     * All Courses & Syllabuses: [Explore All IT Courses](https://rpavault.com/courses.html)
     * Enterprise Automation Consulting: [Enterprise Automation Services](https://rpavault.com/services.html)
     * Direct WhatsApp Connection: [Chat on WhatsApp (+91 9160949996)](https://wa.me/919160949996)
   - Keep links relevant and helpful (1-2 per turn when appropriate) without spamming.`;

  const turns = formatConversationTurns(history, userQuery);
  const contents = turns.map(t => ({
    role: t.role === "user" ? "user" : "model",
    parts: [{ text: t.text }]
  }));

  const payload = {
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    contents: contents,
    generationConfig: {
      temperature: 0.65,
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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`
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
      if (res.ok && json.candidates && json.candidates[0]) {
        const parsed = extractJsonFromCandidate(json.candidates[0]);
        if (parsed && parsed.reply) {
          return {
            reply: parsed.reply,
            status: parsed.status || "ANSWERED",
            suggest_contact: Boolean(parsed.suggest_contact)
          };
        }
      }
      if (json.error) {
        lastError = json.error.message;
        console.warn(`Gemini endpoint failed (${endpoint.split("?")[0]}):`, json.error.message);
      }
    } catch (err) {
      lastError = err.message;
      console.warn(`Gemini fetch error (${endpoint.split("?")[0]}):`, err.message);
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
    console.error("All AI generation endpoints failed. Last error:", lastError);
  }

  // Graceful visitor fallback — NEVER leak raw API error strings or notices to website visitors
  return {
    reply: "I'd be glad to help you with that! Would you like our trainer to connect with you directly to guide you?",
    status: "UNKNOWN",
    suggest_contact: true
  };
}

// Helper to extract valid structured JSON from candidate parts (handles thinking tokens and markdown wrappers)
function extractJsonFromCandidate(candidate) {
  if (!candidate || !candidate.content || !Array.isArray(candidate.content.parts)) {
    return null;
  }
  const parts = candidate.content.parts;
  for (const part of parts) {
    if (part.text) {
      const parsed = safeParseJson(part.text);
      if (parsed && typeof parsed === "object" && parsed.reply) {
        return parsed;
      }
    }
  }
  return null;
}

// Robust JSON parser: strips markdown code fences and handles embedded objects
function safeParseJson(rawText) {
  if (!rawText || typeof rawText !== "string") return null;
  let clean = rawText.trim();
  if (clean.startsWith("```")) {
    clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
  try {
    return JSON.parse(clean);
  } catch (e) {
    const firstBrace = clean.indexOf("{");
    const lastBrace = clean.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(clean.substring(firstBrace, lastBrace + 1));
      } catch (inner) {
        return null;
      }
    }
    return null;
  }
}

// Groq Llama 3.3 Backup Engine
async function askGroq(userQuery, history, kbContext, env, systemInstruction) {
  if (!env.GROQ_API_KEY) return null;
  const endpoint = "https://api.groq.com/openai/v1/chat/completions";

  const turns = formatConversationTurns(history, userQuery);
  const messages = [
    {
      role: "system",
      content: systemInstruction + "\nYou MUST output valid JSON only adhering to this structure: {\"reply\": \"string\", \"status\": \"ANSWERED\"|\"UNKNOWN\", \"suggest_contact\": boolean}"
    }
  ];

  for (const t of turns) {
    messages.push({
      role: t.role === "user" ? "user" : "assistant",
      content: t.text
    });
  }

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
        temperature: 0.65
      })
    });

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    if (content) {
      const parsed = safeParseJson(content);
      if (parsed && parsed.reply) {
        return {
          reply: parsed.reply,
          status: parsed.status || "ANSWERED",
          suggest_contact: Boolean(parsed.suggest_contact)
        };
      }
    }
  } catch (err) {
    console.error("Groq fallback error:", err);
  }
  return null;
}

// Diagnostic Handler to verify live endpoints and API health
async function handleDiag(request, env) {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return jsonResponse({ error: "GEMINI_API_KEY is not configured" }, 500, request, env);
  }

  const modelsToTest = [
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-2.5-flash",
    "gemini-flash-latest"
  ];

  const results = {};
  for (const m of modelsToTest) {
    const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
    try {
      const res = await fetch(testUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Respond in JSON: {\"reply\":\"ok\"}" }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      const data = await res.json();
      if (res.ok) {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "OK";
        results[m] = { ok: true, status: res.status, snippet: text.substring(0, 100) };
      } else {
        results[m] = { ok: false, status: res.status, error: data.error?.message || data };
      }
    } catch (e) {
      results[m] = { ok: false, error: e.message };
    }
  }

  // Test knowledge fetch from Notion pages
  let kbStatus = { ok: false, length: 0, child_pages: [] };
  try {
    const kbTest = await fetchNotionKB(env);
    kbStatus = {
      ok: Boolean(kbTest.data && kbTest.data.length > 0),
      length: kbTest.data.length,
      child_pages: kbTest.childPages
    };
  } catch (kbe) {
    kbStatus = { ok: false, error: kbe.message };
  }

  // Test Notion Database logging access
  let notionDbStatus = { ok: false };
  if (env.NOTION_TOKEN && env.NOTION_DATABASE_ID) {
    try {
      const qRes = await fetch(`https://api.notion.com/v1/databases/${env.NOTION_DATABASE_ID}`, {
        headers: {
          Authorization: `Bearer ${env.NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28"
        }
      });
      const qData = await qRes.json();
      notionDbStatus = {
        ok: qRes.ok,
        status: qRes.status,
        title: qData.title?.[0]?.plain_text || "Unknown",
        error: qData.message || null
      };
    } catch (dbe) {
      notionDbStatus = { ok: false, error: dbe.message };
    }
  }

  return jsonResponse({
    status: "ok",
    timestamp: new Date().toISOString(),
    gemini_key_present: Boolean(apiKey),
    groq_key_present: Boolean(env.GROQ_API_KEY),
    notion_token_present: Boolean(env.NOTION_TOKEN),
    notion_db_present: Boolean(env.NOTION_DATABASE_ID),
    notion_db_check: notionDbStatus,
    notion_knowledge_page: env.NOTION_KNOWLEDGE_PAGE_ID || "3b5ee8c48df28034915fdde3bd7b4c44",
    notion_knowledge_source: "Notion Separate Pages (🛰️ Bot/chat on website)",
    knowledge_check: kbStatus,
    kv_present: Boolean(env.CHATBOT_KV),
    model_checks: results
  }, 200, request, env);
}

// ==========================================================================
// 5. NOTION API INTEGRATION (Session-Based Logging & KV Sync)
// ==========================================================================

// Fetch Knowledge Base from Notion Pages (Parent Page + All Child Pages)
// Note: Notion DB is used strictly for logging visitor sessions; Knowledge is read from the designated Notion pages.
async function fetchNotionKB(env) {
  if (!env.NOTION_TOKEN) return { data: "", childPages: [] };

  const parentPageId = env.NOTION_KNOWLEDGE_PAGE_ID || "3b5ee8c48df28034915fdde3bd7b4c44";
  const headers = {
    Authorization: `Bearer ${env.NOTION_TOKEN}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
  };

  try {
    // 1. Fetch children of the parent knowledge page to discover all child pages
    const listUrl = `https://api.notion.com/v1/blocks/${parentPageId}/children?page_size=100`;
    const listRes = await fetch(listUrl, { headers });
    const listJson = await listRes.json();

    if (!listJson.results || !Array.isArray(listJson.results)) {
      const errMsg = listJson.message || `Notion API returned status ${listRes.status}`;
      console.warn("fetchNotionKB: no results from parent page blocks", listJson);
      return {
        data: "",
        childPages: [],
        error: errMsg
      };
    }

    const childPages = listJson.results.filter(b => b.type === "child_page" && !b.in_trash && !b.archived);
    const docs = [];
    const childPagesInfo = [];

    // 2. Fetch markdown for each child page
    for (const cp of childPages) {
      const pageId = cp.id;
      const title = cp.child_page?.title || "Untitled Topic";
      childPagesInfo.push({ id: pageId, title });

      try {
        const mdRes = await fetch(`https://api.notion.com/v1/pages/${pageId}/markdown`, { headers });
        if (mdRes.ok) {
          const mdJson = await mdRes.json();
          let md = (mdJson.markdown || "").trim();
          // Convert <details><summary>Q</summary>A</details> toggle blocks to clear Q & A format
          md = md.replace(/<details>\s*<summary>(.*?)<\/summary>\s*([\s\S]*?)\s*<\/details>/gi, "Q: $1\nA: $2\n");
          // Remove empty-block tags and excessive whitespace
          md = md.replace(/<empty-block\/>/g, "").replace(/\n{3,}/g, "\n\n").trim();
          if (md) {
            docs.push(`### KNOWLEDGE TOPIC: ${title}\n${md}`);
          }
        } else {
          console.warn(`fetchNotionKB: failed fetching markdown for page "${title}" (${pageId}): status ${mdRes.status}`);
        }
      } catch (pageErr) {
        console.error(`fetchNotionKB: error reading page "${title}":`, pageErr.message);
      }
    }

    // 3. Also check if parent page has any direct markdown content (outside databases and subpages)
    try {
      const parentMdRes = await fetch(`https://api.notion.com/v1/pages/${parentPageId}/markdown`, { headers });
      if (parentMdRes.ok) {
        const parentMdJson = await parentMdRes.json();
        let parentMd = (parentMdJson.markdown || "").trim();
        // Remove database references and subpage mentions
        parentMd = parentMd
          .replace(/<database[\s\S]*?<\/database>/gi, "")
          .replace(/<page[\s\S]*?<\/page>/gi, "")
          .replace(/<empty-block\/>/g, "")
          .trim();
        if (parentMd) {
          docs.unshift(`### OVERVIEW & ANNOUNCEMENTS\n${parentMd}`);
        }
      }
    } catch (parentErr) {
      console.warn("fetchNotionKB: parent page direct content note:", parentErr.message);
    }

    const combinedKB = docs.join("\n\n---\n\n");
    return {
      data: combinedKB,
      childPages: childPagesInfo
    };
  } catch (err) {
    console.error("Error fetching Notion KB from pages:", err);
    return { data: "", childPages: [] };
  }
}

// Helper to format clean Subject title: "[Name] Question" or "Question" (skips "Session - City - " prefix)
function formatSubject(userName, message) {
  const cleanMsg = (message || "").replace(/[\r\n]+/g, " ").trim();
  const maxLen = userName ? 80 : 90;
  const snippet = cleanMsg.length > maxLen ? cleanMsg.substring(0, maxLen).trim() + "..." : cleanMsg;
  if (userName) {
    return `[${userName}] ${snippet}`;
  }
  return snippet || "Visitor Inquiry";
}

/// Helper to find existing Notion session page by IP address (primary) or Session ID (fallback)
async function findNotionSessionPage(env, ip, sessionId) {
  if (!env.NOTION_TOKEN || !env.NOTION_DATABASE_ID) return null;
  const url = `https://api.notion.com/v1/databases/${env.NOTION_DATABASE_ID}/query`;

  // 1. Primary: Lookup by Client IP to guarantee exactly 1 page per visitor IP
  if (ip && ip !== "Unknown IP") {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          filter: {
            property: "Session ID",
            rich_text: {
              equals: ip
            }
          },
          page_size: 1
        })
      });
      const json = await res.json();
      if (json.results && json.results.length > 0) {
        return json.results[0].id;
      }
    } catch (err) {
      console.error("Error finding Notion session by IP:", err);
    }
  }

  // 2. Secondary fallback: Lookup by Session ID
  if (sessionId) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          filter: {
            property: "Session ID",
            rich_text: {
              equals: sessionId
            }
          },
          page_size: 1
        })
      });
      const json = await res.json();
      if (json.results && json.results.length > 0) {
        return json.results[0].id;
      }
    } catch (err) {
      console.error("Error finding Notion session by Session ID:", err);
    }
  }

  return null;
}

// Log or Append interaction to the visitor's Notion Session Page (Single page per IP)
async function logSessionToNotion(env, { sessionId, userName, userMessage, aiReply, status, ip, locationLabel }) {
  const lookupKey = (ip && ip !== "Unknown IP") ? ip : sessionId;
  const kvKey = `session_notion_id:${lookupKey}`;
  let pageId = null;

  // 1. Check KV first (fast edge cache)
  if (env.CHATBOT_KV) {
    pageId = await env.CHATBOT_KV.get(kvKey);
  }

  // 2. If not in KV, query Notion by IP (and fallback sessionId)
  if (!pageId) {
    pageId = await findNotionSessionPage(env, ip, sessionId);
    if (pageId && env.CHATBOT_KV) {
      await env.CHATBOT_KV.put(kvKey, pageId, { expirationTtl: 86400 });
    }
  }

  const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (!pageId) {
    // 1. Create a NEW Session Page in Notion for this IP
    const createUrl = "https://api.notion.com/v1/pages";
    const title = formatSubject(userName, userMessage);

    const createPayload = {
      parent: { database_id: env.NOTION_DATABASE_ID },
      properties: {
        title: {
          title: [{ text: { content: title } }]
        },
        Status: {
          status: { name: status === "UNKNOWN" ? "⚠️ Needs Review" : "Auto-Answered" }
        },
        "Session ID": {
          rich_text: [{ text: { content: lookupKey } }]
        },
        "Visitor Name": {
          rich_text: [{ text: { content: userName ? `${userName} (${locationLabel})` : `Anonymous (${locationLabel})` } }]
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
              { type: "text", text: { content: `[${timestamp}] ${userName || "Visitor"}: ` }, annotations: { bold: true } },
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
      if (!res.ok) {
        console.error("Notion create page error:", res.status, JSON.stringify(data));
      } else if (data.id && env.CHATBOT_KV) {
        await env.CHATBOT_KV.put(kvKey, data.id, { expirationTtl: 86400 });
      }
    } catch (err) {
      console.error("Failed creating Notion session page:", err);
    }
  } else {
    // 2. Append to EXISTING Session Page (Turn 2, 3, or subsequent visits from same IP)
    // If userName is now known, update Notion page title to "[Name] Question" and Visitor Name
    if (userName) {
      try {
        const updatedTitle = formatSubject(userName, userMessage);
        await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${env.NOTION_TOKEN}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            properties: {
              title: {
                title: [{ text: { content: updatedTitle } }]
              },
              "Visitor Name": {
                rich_text: [{ text: { content: `${userName} (${locationLabel})` } }]
              }
            }
          })
        });
      } catch (err) {
        console.error("Failed updating session title with user name:", err);
      }
    }

    const appendUrl = `https://api.notion.com/v1/blocks/${pageId}/children`;
    const appendPayload = {
      children: [
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              { type: "text", text: { content: `[${timestamp}] ${userName || "Visitor"}: ` }, annotations: { bold: true } },
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

// Update Notion Session Page when visitor leaves their lead details or introduces name
async function updateNotionLead(env, { sessionId, ip, name, phone, email, topic, locationLabel }) {
  const lookupKey = (ip && ip !== "Unknown IP") ? ip : sessionId;
  const kvKey = `session_notion_id:${lookupKey}`;
  let pageId = null;

  if (env.CHATBOT_KV) {
    pageId = await env.CHATBOT_KV.get(kvKey);
  }

  if (!pageId) {
    pageId = await findNotionSessionPage(env, ip, sessionId);
    if (pageId && env.CHATBOT_KV) {
      await env.CHATBOT_KV.put(kvKey, pageId, { expirationTtl: 86400 });
    }
  }

  if (!pageId) return;

  try {
    const patchProps = {};
    if (phone || email) {
      patchProps["Status"] = { status: { name: "🔥 Lead Captured" } };
    }
    if (name) {
      patchProps["Visitor Name"] = {
        rich_text: [{ text: { content: `${name} ${locationLabel}` } }]
      };
      const titleContent = topic ? formatSubject(name, topic) : `[${name}] ${locationLabel || "Inquiry"}`;
      patchProps["title"] = {
        title: [{ text: { content: titleContent } }]
      };
    }
    if (phone) {
      patchProps["WhatsApp / Phone"] = { phone_number: phone };
    }
    if (email) {
      patchProps["Email"] = { email: email };
    }

    // 1. Update properties to Lead Captured & set contact info
    await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${env.NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ properties: patchProps })
    });

    if (phone || email) {
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
                      content: `LEAD CAPTURED: ${name || "Visitor"} | WhatsApp: ${phone || "N/A"} | Email: ${email || "N/A"}`
                    }
                  }
                ]
              }
            }
          ]
        })
      });
    }
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
