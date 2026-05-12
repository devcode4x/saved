# Telegram Saved Vault

A clean, modern, dark-themed personal cloud built on **your own Telegram Saved Messages**.
Powered by **FastAPI + Telethon** (backend) and **React + Vite + TailwindCSS + shadcn/ui** (frontend).

> Your Saved Messages chat (`peer='me'`) becomes your private database — notes, snippets, anything text.

---

## ✨ Features

- 🔐 Login with your own `API_ID`, `API_HASH`, phone, optional 2FA
- 📲 Handles SMS / Telegram code prompts properly
- 📝 Save raw text notes (with `#tags`) directly to **Saved Messages**
- 📜 List, search, view, delete messages — all live from Telegram
- 📊 Stats overview
- 🌙 Soft, premium dark UI (shadcn/ui + Tailwind)
- 🧰 Per-user Telethon session files stored on the backend
- 🚪 Logout clears the session

---

## 🗂 Project structure

```
telegram-saved-vault/
├── backend/
│   ├── main.py              # FastAPI app + all endpoints
│   ├── telegram_manager.py  # Telethon wrapper (login, CRUD on Saved Messages)
│   ├── models.py            # Pydantic models
│   ├── requirements.txt
│   ├── .env.example
│   └── sessions/            # Telethon .session files (gitignored)
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── tsconfig.json
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css
        ├── lib/
        │   ├── api.ts        # axios client
        │   └── utils.ts
        ├── pages/
        │   ├── Login.tsx
        │   └── Dashboard.tsx
        ├── hooks/
        │   └── useAuth.ts
        └── components/ui/    # shadcn/ui primitives
```

---

## 🔑 1. Get your Telegram API credentials

1. Go to <https://my.telegram.org> and log in with your phone.
2. Click **API development tools**.
3. Create an app — any name/short name works.
4. Copy the **`api_id`** (a number) and **`api_hash`** (a string).

These belong to **you** — never share them.

---

## 🚀 2. Run the backend (FastAPI + Telethon)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate           # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                # adjust if needed
uvicorn main:app --reload --port 8000
```

The API is now live at <http://localhost:8000> with interactive docs at
<http://localhost:8000/docs>.

---

## 🎨 3. Run the frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>.

The frontend talks to `http://localhost:8000` by default. Override via
`frontend/.env`:

```
VITE_API_URL=http://localhost:8000
```

---

## 🔐 4. Login flow

1. Enter `API_ID`, `API_HASH`, phone (with `+` country code), optional 2FA.
2. Click **Connect to Telegram**.
3. Telegram sends you a login code → the UI shows a code field → paste it.
4. If you have 2FA enabled and didn't enter it upfront, you'll be prompted.
5. You're in. The session file is stored at `backend/sessions/<phone>.session`
   so you won't have to log in again until you click **Logout**.

---

## 🤖 5. (Optional) BotFather Mini App

If you want to expose this UI as a Telegram Mini App:

1. Open [@BotFather](https://t.me/BotFather) → `/newbot` → get a bot token.
2. `/setmenubutton` → choose your bot → label "Open Vault" → URL = your
   deployed frontend URL (must be HTTPS).
3. Done — users tap the menu button to open the Mini App.

> Note: when running as a Mini App, users still need to provide their own
> `API_ID` / `API_HASH` because Telethon acts as a userbot, not as your bot.

---

## 🌍 6. Deployment tips

- **Backend**: any host that runs Python long-lived processes works — Fly.io,
  Railway, Render, a small VPS. Cloudflare Workers / Vercel serverless do
  **not** work (Telethon needs a persistent connection + file storage).
- **Frontend**: any static host — Vercel, Netlify, Cloudflare Pages.
- Set `VITE_API_URL` to your backend's public HTTPS URL.
- Persist `backend/sessions/` on a real volume (otherwise users re-login on
  every redeploy).
- Put the backend behind HTTPS + a real auth layer if exposing publicly.

---

## ⚠️ Security notes

- Session files = full account access. Treat `backend/sessions/` like secrets.
- This template stores sessions in plain `.session` files for simplicity. For
  production, encrypt them at rest and add real per-user auth in front of the
  API.
- Rate-limit `/api/login` if exposed to the internet.

---

## 📝 License

MIT — do whatever you like. Built with ❤️ for Telegram power users.
