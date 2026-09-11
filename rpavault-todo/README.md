# RPAVault To-Do (`rpavault-todo`)

A high-performance, TickTick-style task management web application integrated directly with Notion's "Team To Do's" database, built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and SQLite.

Hosted under the URL slug: **`/2do/`**

---

## ⚡ Quick Start

### 1. Requirements
- Node.js 18+ or 20+
- A Notion Integration Token with read/write access to your "Team To Do's" database.

### 2. Configure Environment Variables
Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```
Fill in the credentials:
```env
NOTION_TOKEN=secret_your_notion_integration_token_here
NOTION_DATA_SOURCE_ID=bb9ee8c4-8df2-82ec-8281-815b6c3ddb80
AUTH_USERNAME=admin
AUTH_PASSWORD=rpavault
SHIVANI_USERNAME=shivani
SHIVANI_PASSWORD=rpavault123
SESSION_SECRET=a_long_32_character_session_encryption_secret_key!
```

### 🔑 User Access & Changing Passwords
To change passwords or modify user credentials in the future:
1. Open `.env.local` inside `rpavault-todo/`.
2. Update `AUTH_PASSWORD` for the Admin / Kumar user or `SHIVANI_PASSWORD` for Shivani.
3. Save the file and restart the Next.js process (`npm run build && npm start` or `npm run dev`).
4. Session tokens will validate against the updated credentials upon subsequent logins.

### 3. Share Database with Notion Integration
> [!IMPORTANT]
> In Notion, open your **Team To Do's** database, click **"..."** at the top-right corner, go to **Connections**, and add your integration. Without this step, Notion API calls will return `404 Object Not Found`.

### 4. Run Development Server
```bash
npm run dev
```
Open **`http://localhost:3000/2do`** (or `/2do/login`) in your browser.

---

## 🚀 Key Features

- **Base Path Routing**: Operates entirely under `/2do/` without disrupting root or other application pathways.
- **Single-User Clean Auth**: Minimalist dark-card login inspired by TickTick, protected with signed HTTP-only session cookies and Next.js middleware.
- **Smart Lists Driven by Pure Dates**:
  - `Today`, `Tomorrow`, `Next 7 Days`, `Overdue`, `No Date`, `All Tasks`
  - Recomputed dynamically every 60 seconds without database mutations (e.g. tasks automatically transition into `Overdue` past midnight).
- **Recurrence Engine (`computeNextDue`)**:
  - Full support for `Day(s)`, `Week(s)`, `Month(s)`, `Month(s) on the First/Last Weekday`, `Month(s) on the Last Day`, `Year(s)`, and `Nth Weekday of Month`.
  - Automatic advance on completion via `completeAndReschedule`.
  - Thoroughly covered with 19 passing unit tests (`npm test`).
- **Natural Language Quick-Add**:
  - Type e.g. `"Prepare RPA proposal tomorrow 5pm #RPAVAULT"` into the quick-add bar.
  - Automatic date extraction powered by `chrono-node`.
- **Keyboard Shortcuts**:
  - `Q` or `N`: Jump focus to quick-add bar.
  - `Esc`: Close detail panel / blur input.
  - `Enter`: Submit new task.
- **Background Sync**:
  - Automatic 2-minute polling sync with Notion.
  - Manual "Sync now" button with last-synced timestamp.
  - Conflict-free merge avoiding overwrite of recently edited fields.
- **Setup Guidance Screen**:
  - Displays actionable instructions if Notion token or connection is missing.

---

## 📝 Known Limitations

- **No Push / Real-time Webhooks**: Notion's public API does not offer native webhooks for row updates. Sync is powered by lightweight 2-minute background polling and manual sync.
- **Drag-to-Reorder Persistence**: Drag and drop ordering in the UI is visual/local state, as Notion databases do not have a dedicated user-reorderable float index.

---

## 🧪 Testing

Run the Vitest test suite for recurrence calculations:
```bash
npm test
```
