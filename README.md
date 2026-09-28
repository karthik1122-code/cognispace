<div align="center">

<img width="80" src="https://em-content.zobj.net/source/apple/391/brain_1f9e0.png" alt="CogniSpace logo" />

# CogniSpace

### AI-Enhanced Collaborative Workspace · Built like Notion, Powered by Gemini

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://cognispace.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render)](https://cognispace-api.onrender.com)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

</div>

---

## ✨ What is CogniSpace?

**CogniSpace** is a premium, full-stack collaborative workspace — think Notion meets Linear, supercharged with Google Gemini AI. Write rich documents, organize nested pages, manage sprint tasks in a database table, and get inline AI assistance, all in a stunning dark-mode interface.

---

## 🖥️ Screenshots

> *Open the live demo to see it in action →* [cognispace.vercel.app](https://cognispace.vercel.app)

---

## 🚀 Feature Overview

### 📝 Rich Block Editor (Notion-Style)
| Feature | Description |
|---|---|
| `/` Slash Command Menu | 10 block types: H1/H2/H3, Toggle, Checklist, Bullet List, Numbered List, Code, Blockquote, AI |
| **Toggle Blocks** | Click ▶ to expand/collapse — great for FAQs and nested notes |
| **Interactive Checklists** | `☑` Task items with strikethrough on completion, support for nesting |
| **Floating AI Toolbar** | Highlight any text → **Rewrite** or **Summarize** with Gemini |
| Inline Code, Bold, Italic | Rich text formatting on selected text |
| Autosave | 800ms debounced save with `Saved / Saving... / Error` indicator |

### 🗂️ Organizing (Sidebar)
| Feature | Description |
|---|---|
| **Nested Sub-pages** | Create child pages under any page, collapse/expand with `▶` |
| **Page Templates** | 📋 Meeting Notes · 🚀 Project Plan · 📚 Wiki/Docs · 📅 Daily Journal |
| ⭐ Starred Pages | Favorite any page — appears in the "Favorites" section |
| **Tags** | Add, remove color-coded tags per page |
| Page Properties | Status, Priority, Assignee, Last Edited, Word Count |
| Cover Images + Emoji | Beautiful gradient covers, 15 emoji icons |
| `⌘K` Quick Search | Full-text search across all pages |

### 🤖 AI Copilot (Google Gemini)
| Feature | Description |
|---|---|
| AI Omnibar (`⌘J`) | Bottom command bar — ask Gemini anything about your document |
| Real-time SSE Streaming | Token-by-token streaming, exactly like ChatGPT |
| Stop Button | Instantly cancel any AI stream mid-response |
| Quick Prompts | One-click shortcuts: Summarize · Key Insights · Sprint Tasks · Code Block |
| AI Inspector View | Dedicated AI workspace panel inside each document |

### 🏃 Sprint Database
| Feature | Description |
|---|---|
| Sprint Table | Full task database with Status, Priority, Assignee, Due Date, Progress |
| Inline Editing | Click any cell to edit in-place |
| Status/Priority Cycling | Click status badge to cycle: In Progress → In Review → Done → Backlog |
| Progress Bar | Click to increment 0% → 25% → 50% → 75% → 100% |
| Add/Delete Tasks | Add new issues, delete with confirmation |
| Filter by Status | Filter pills for All / In Progress / In Review / Done |

---

## 🛠️ Tech Stack

```
Frontend                     Backend
──────────────────────────   ──────────────────────────
React 19 + TypeScript 6      Express.js 5 (Node 22)
Vite 8 (build tool)          MongoDB + Mongoose ODM
Tailwind CSS 3               JWT Authentication
Tiptap 3 (block editor)      Server-Sent Events (SSE)
Framer Motion (animations)   Google Gemini AI SDK
Lucide React (icons)         bcryptjs (password hashing)
```

**Deployment:**
- 🌐 Frontend → [Vercel](https://vercel.com)
- 🖥️ Backend → [Render](https://render.com)
- 🍃 Database → [MongoDB Atlas](https://mongodb.com/atlas) (free tier)

---

## 🏗️ Project Structure

```
cognispace/
├── src/                          # React frontend
│   ├── components/
│   │   ├── dashboard/
│   │   │   └── WorkspaceDashboard.tsx   # Main workspace (sidebar, editor, DB)
│   │   ├── editor/
│   │   │   ├── BlockEditor.tsx          # Tiptap rich-text editor
│   │   │   ├── SlashCommandMenu.tsx     # / command popup
│   │   │   └── AiSelectionBubbleMenu.tsx
│   │   └── ...
│   ├── utils/
│   │   └── aiStream.ts                  # SSE stream reader
│   └── App.tsx
│
├── server/                       # Express backend
│   ├── server.js                 # Main app + all API routes
│   ├── controllers/
│   │   └── aiController.js       # Gemini SSE streaming
│   └── models/
│       ├── User.js
│       ├── Document.js
│       └── Task.js
│
├── render.yaml                   # Render.com deployment config
├── vercel.json                   # Vercel deployment config
└── README.md
```

---

## ⚡ Local Development

### Prerequisites
- Node.js `≥ 20`
- A [Gemini API key](https://aistudio.google.com/app/apikey) (free)

### 1. Clone the repo
```bash
git clone https://github.com/karthik1122-code/cognispace.git
cd cognispace
```

### 2. Install frontend dependencies
```bash
npm install
```

### 3. Install backend dependencies
```bash
cd server && npm install && cd ..
```

### 4. Set up backend environment
```bash
cp server/.env.example server/.env
# Edit server/.env and fill in GEMINI_API_KEY and JWT_SECRET
```

### 5. Run backend
```bash
cd server && node server.js
# Starts on http://localhost:3001
# Uses embedded MongoDB (no Atlas needed for dev!)
```

### 6. Run frontend
```bash
npm run dev
# Opens http://localhost:5173
```

---

## ☁️ Deployment Guide

### Step 1 — MongoDB Atlas (Database)
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas) → Create free cluster
2. Create a database user and whitelist `0.0.0.0/0` (allow all IPs for Render)
3. Copy the connection string: `mongodb+srv://user:pass@cluster.mongodb.net/cognispace`

### Step 2 — Deploy Backend to Render
1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New Web Service** → Connect GitHub repo
3. Render auto-detects `render.yaml` — click **Deploy**
4. In Render Dashboard → **Environment**, add these secrets:

| Key | Value |
|---|---|
| `MONGODB_URI` | Your Atlas connection string |
| `JWT_SECRET` | Any long random string (e.g. `openssl rand -hex 32`) |
| `GEMINI_API_KEY` | Your Gemini API key |
| `CORS_ORIGINS` | Your Vercel URL (add after Step 3) |

5. Note your Render URL: `https://cognispace-api.onrender.com`

### Step 3 — Deploy Frontend to Vercel
1. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import from GitHub
2. Vercel auto-detects Vite — click **Deploy**
3. In Vercel Dashboard → **Settings → Environment Variables**, add:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://cognispace-api.onrender.com` |

4. Redeploy to apply the env var
5. Copy your Vercel URL: `https://cognispace.vercel.app`

### Step 4 — Final CORS wiring
Back in Render → Environment, update `CORS_ORIGINS` to your Vercel URL:
```
CORS_ORIGINS=https://cognispace.vercel.app
```
Render will auto-redeploy. You're live! 🎉

---

## 🔑 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Login, returns JWT |
| `POST` | `/api/auth/logout` | Clear session |
| `GET` | `/api/auth/me` | Get current user |

### Documents
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/documents` | List all pages |
| `POST` | `/api/documents` | Create new page |
| `GET` | `/api/documents/:id` | Get single page |
| `PATCH` | `/api/documents/:id` | Update page |
| `DELETE` | `/api/documents/:id` | Delete page |

### Tasks (Sprint DB)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/tasks` | List all tasks |
| `POST` | `/api/tasks` | Create task |
| `PATCH` | `/api/tasks/:id` | Update task |
| `DELETE` | `/api/tasks/:id` | Delete task |

### AI
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai/transform` | Stream Gemini AI response (SSE) |

### Health
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server + DB status |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `⌘B` | Toggle sidebar |
| `⌘K` | Open quick search |
| `⌘J` | Focus AI omnibar |
| `⌘N` | New document |
| `/` | Open slash command menu in editor |
| `Escape` | Close any open menu |

---

## 🤝 Contributing

1. Fork the repo
2. Create your feature branch: `git checkout -b feat/my-feature`
3. Commit changes: `git commit -m 'feat: add my feature'`
4. Push: `git push origin feat/my-feature`
5. Open a Pull Request

---

## 📄 License

MIT © 2026 CogniSpace — Built with ❤️ using React, Express & Google Gemini

---

<div align="center">

**[Live Demo](https://cognispace.vercel.app) · [Report Bug](https://github.com/karthik1122-code/cognispace/issues) · [Request Feature](https://github.com/karthik1122-code/cognispace/issues)**

</div>
