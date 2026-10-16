# 🤖 RPAVault AI Career Counselor & Self-Improving Chatbot

A high-converting, empathetic AI Career Counselor for **RPAVault** powered by **Google Gemini 2.5 Flash**, **Cloudflare Workers KV**, and **Notion** as the self-improving Knowledge Base & CRM.

---

## 📁 Directory Structure

```text
chatbot/
├── index.html           <- Dedicated Full-Page Counselor Experience (rpavault.com/chatbot/)
├── widget.js            <- Universal Controller (Handles Full-Page Mode & Floating Bubble Mode)
├── widget.css           <- Modern, responsive styling matching RPAVault's slate/blue brand
├── README.md            <- Architecture and integration overview
│
└── backend/
    ├── worker.js        <- Cloudflare Edge API (KV cache, Gemini JSON, Notion Session Logger)
    └── wrangler.toml    <- Cloudflare Wrangler configuration
```

---

## 🔒 Configuration & Internal Runbook

Detailed infrastructure instructions, Notion integration tokens, database schema configurations, Cloudflare Worker secrets, and KV sync commands are maintained securely in the private team workspace:

👉 **Internal Runbook:** [Notion Workspace — Bot/chat on website](https://app.notion.com/p/Bot-chat-on-website-3b5ee8c48df28034915fdde3bd7b4c44)  
👉 **Detailed Setup Guide:** [Chatbot Setup & Cloudflare Workers Runbook](https://app.notion.com/p/Chatbot-Setup-Cloudflare-Workers-Runbook-3fbee8c48df281908b16c538bb127187)

> [!NOTE]
> In accordance with security best practices, private API tokens, database UUIDs, and administrative keys are maintained strictly in the internal Notion workspace rather than repository markdown files. Refer to the Notion workspace runbook for credentials, Cloudflare Worker environment secrets, and manual KV synchronization triggers.

---

## 🚀 Frontend Integration & Usage

### 1. Dedicated Full-Page Mode
Visitors can navigate to:
```text
https://rpavault.com/chatbot/
```
This serves `chatbot/index.html` as a standalone, mobile-responsive AI Career Counselor screen with zero friction.

### 2. Floating Chat Bubble Mode
To embed the floating chat counselor across pages, include the widget assets and runtime configuration before `</body>`:

```html
<link rel="stylesheet" href="/chatbot/widget.css" />
<script>
  window.RPAVAULT_CHAT_CONFIG = {
    apiUrl: "https://hikumarswamy.workers.dev/api/chat",
    leadUrl: "https://hikumarswamy.workers.dev/api/chat/lead"
  };
</script>
<script src="/chatbot/widget.js" defer></script>
```
