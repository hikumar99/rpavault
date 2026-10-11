# 🤖 RPAVault AI Career Counselor & Self-Improving Chatbot

A high-converting, empathetic AI Career Counselor for **RPAVault** powered by **Google Gemini 2.5 Flash**, **Cloudflare Workers KV**, and **Notion** as the self-improving Knowledge Base & CRM.

---

## 📁 What is Inside This Folder

```text
chatbot/
├── index.html           <- Dedicated Full-Page Counselor Experience (rpavault.com/chatbot/)
├── widget.js            <- Universal Controller (Handles Full-Page Mode & Floating Bubble Mode)
├── widget.css           <- Modern, responsive styling matching RPAVault's slate/blue brand
├── README.md            <- This setup guide
│
└── backend/
    ├── worker.js        <- Cloudflare Edge API (KV cache, Gemini JSON, Notion Session Logger)
    └── wrangler.toml    <- Cloudflare Wrangler configuration
```

---

## 🛠️ Step 1: Set Up the Notion Database

Create a new database in your Notion workspace (e.g. inside your *Bot or chat thing on website* page) named **`Chatbot Hub: Counselor & Logs`**.

### Database Properties
Configure the following columns:

| Property Name | Property Type | Options / Purpose |
| :--- | :--- | :--- |
| **Topic / User Query** | **Title** | The session title or canonical question |
| **Answer / Response** | **Text (Rich text)** | The verified answer (for KB rows) |
| **Record Type** | **Select** | `Knowledge Base`, `Chat Log` |
| **Status** | **Status** | `Approved`, `Auto-Answered`, `⚠️ Needs Review`, `🔥 Lead Captured` |
| **Category** | **Select** | `Career Guidance`, `Courses & Fees`, `Batches & Schedules`, `Placement` |
| **Session ID** | **Text (Rich text)** | Unique session tracker (e.g., `sess_...`) |
| **Visitor Contact** | **Text (Rich text)** | Phone, Email, IP, and City details |

### Suggested Filtered Views to Create in Notion
1. **📚 Active Knowledge Base:** Filter `Record Type = Knowledge Base` AND `Status = Approved`.
2. **⚠️ Review Queue:** Filter `Status = ⚠️ Needs Review` (Shows unhandled visitor questions).
3. **🔥 Hot Leads:** Filter `Status = 🔥 Lead Captured` (Shows leads with WhatsApp numbers).
4. **💬 All Sessions:** Filter `Record Type = Chat Log`, sorted by newest first.

---

## 🔑 Step 2: Notion API Token & Permissions

1. Visit [notion.so/profile/integrations](https://www.notion.so/profile/integrations) and create a **New Integration** named `RPAVault Bot`.
2. Copy the **Internal Integration Secret** (`ntn_...` or `secret_...`).
3. Open your new Notion database $\rightarrow$ click the **`...` menu** (top right) $\rightarrow$ **Connect to** $\rightarrow$ select `RPAVault Bot`.
4. Copy the **Database ID** from the Notion URL:
   `https://www.notion.com/{workspace}/{DATABASE_ID}?v=...` (the 32-character hex string).

---

## 🧠 Step 3: Google Gemini API Key

1. Go to [Google AI Studio (aistudio.google.com)](https://aistudio.google.com/).
2. Click **"Get API Key"** $\rightarrow$ **"Create API Key"**.
3. Copy your key. (You can start 100% free; if needed later, link a billing account with a \$5 safety limit).

---

## ⚡ Step 4: Deploy the Cloudflare Worker

### In Cloudflare Dashboard:
1. Go to **Workers & Pages** $\rightarrow$ **KV** $\rightarrow$ Click **"Create a namespace"** and name it `CHATBOT_KV`. Note its ID.
2. Go to **Workers & Pages** $\rightarrow$ **Create Application** $\rightarrow$ **Create Worker** (name it `rpavault-chatbot`).
3. Click **Quick Edit**, paste the entire code from `chatbot/backend/worker.js`, and click **Deploy**.
4. Go to Worker **Settings** $\rightarrow$ **Variables and Secrets**:
   * **KV Namespace Bindings:**
     * Variable Name: `CHATBOT_KV`
     * KV Namespace: Select your `CHATBOT_KV`
   * **Environment Secrets:**
     * `GEMINI_API_KEY`: Your Gemini API key
     * `NOTION_TOKEN`: Your Notion secret (`ntn_...`)
     * `NOTION_DATABASE_ID`: Your Notion Database ID
     * `ADMIN_SYNC_KEY`: Any secure password you choose (e.g., `rpavault_sync_2026`)
     * `ALLOWED_ORIGIN`: `*` (or `https://rpavault.com`)

---

## 🔄 Step 5: Sync Knowledge Base to Cloudflare KV

Whenever you add or approve questions in Notion:
1. Open this link in your browser:
   ```text
   https://your-worker-name.workers.dev/api/chat/sync?key=YOUR_ADMIN_SYNC_KEY
   ```
2. You will receive:
   ```json
   {
     "success": true,
     "message": "Knowledge Base successfully refreshed into Cloudflare Workers KV!",
     "timestamp": "2026-10-11T..."
   }
   ```
From that millisecond, Cloudflare serves that new knowledge globally in <15ms.

---

## 🚀 Step 6: Using the Dedicated Page & Floating Bubble

### 1. Dedicated Full-Page Mode (Ready Out of the Box!)
Visitors can navigate to:
```text
https://rpavault.com/chatbot/
```
This serves `chatbot/index.html` as a standalone, mobile-responsive AI Career Counselor screen with no setup required.

### 2. Floating Chat Bubble Mode (For Any Page)
Whenever you want the floating chat bubble on any page of your main website, simply add this snippet before `</body>`:

```html
<link rel="stylesheet" href="/chatbot/widget.css" />
<script>
  window.RPAVAULT_CHAT_CONFIG = {
    apiUrl: "https://your-worker-name.workers.dev/api/chat",
    leadUrl: "https://your-worker-name.workers.dev/api/chat/lead",
    formSubmitEmail: "your-email@rpavault.com"
  };
</script>
<script src="/chatbot/widget.js" defer></script>
```
