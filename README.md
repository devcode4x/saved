<div align="center">
  <img src="https://img.shields.io/badge/Telegram-Saved%20Vault-229ED9?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram Saved Vault">
  <h1>Telegram Saved Vault</h1>
  
  <p>
    <strong>A clean, modern & private personal cloud</strong><br>
    Built on <strong>Your Own Telegram Saved Messages</strong>
  </p>

  <p>
    <a href="https://github.com/yourusername/telegram-saved-vault/stargazers">
      <img src="https://img.shields.io/github/stars/yourusername/telegram-saved-vault?style=flat-square&logo=github" alt="Stars">
    </a>
    <a href="https://github.com/yourusername/telegram-saved-vault/issues">
      <img src="https://img.shields.io/github/issues/yourusername/telegram-saved-vault?style=flat-square" alt="Issues">
    </a>
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License">
    <img src="https://img.shields.io/badge/Tech-React%20%2B%20FastAPI-61DAFB?style=flat-square" alt="Tech Stack">
  </p>

  <img src="https://raw.githubusercontent.com/yourusername/telegram-saved-vault/main/screenshot.png" 
       alt="Telegram Saved Vault Preview" width="85%" style="border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">

  <br><br>
  <strong>Powered by FastAPI + Telethon (Backend) • React + Vite + Tailwind + shadcn/ui (Frontend)</strong>
</div>

---

## ✨ Features

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?logo=tailwindcss&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![Telethon](https://img.shields.io/badge/Telethon-229ED9?logo=telegram&logoColor=white)

</div>

- 🔐 **Secure Login** with your own Telegram API credentials
- 📲 Full support for SMS code + 2FA prompts
- 📝 Save notes, snippets, links, and `#tags` directly to Saved Messages
- 🔍 Real-time **Search**, filter, and organize
- 📊 Beautiful **Stats Dashboard**
- 🌙 Premium dark UI with smooth animations (shadcn/ui)
- 🧩 Persistent Telethon sessions per user
- 🚪 One-click logout

---

## 📸 Preview

> (Add GIF or multiple screenshots here)

```html
<!-- You can embed a GIF like this -->
<img src="https://raw.githubusercontent.com/yourusername/telegram-saved-vault/main/demo.gif" 
     alt="Demo" style="border-radius: 12px; width: 100%; max-width: 800px;">
🗂 Project Structure
telegram-saved-vault/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── telegram_manager.py     # Telethon core logic
│   ├── models.py               # Pydantic schemas
│   ├── requirements.txt
│   └── sessions/               # .session files (gitignored)
│
└── frontend/
    ├── src/
    │   ├── pages/              # Login + Dashboard
    │   ├── components/ui/      # shadcn/ui components
    │   ├── hooks/
    │   └── lib/api.ts
    ├── tailwind.config.js
    └── vite.config.ts
🚀 Quick Start
1. Get Telegram API Credentials
Go to https://my.telegram.org
Login with your phone number
Go to API development tools → Create new app
Copy api_id and api_hash
2. Backend
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
3. Frontend
cd frontend
npm install
npm run dev
Open http://localhost:5173
🔑 Login Flow
Enter your API ID, API Hash, and Phone Number (+91xxxxxxxxxx)
Click Connect to Telegram
Enter the code sent by Telegram
(Optional) Enter 2FA password if enabled
Done — Your session is saved securely
🌍 Deployment
Service
Backend
Frontend
Recommended
Railway
Excellent
Excellent
★★★★★
Fly.io
Very Good
Excellent
★★★★★
Render
Good
Excellent
★★★★
Vercel
Not supported
Excellent
-
Important: Backend needs persistent storage for session files.
🤖 Telegram Mini App (Optional)
Turn this into a beautiful Telegram Mini App using BotFather:
Create a bot with @BotFather
Use /setmenubutton → Set URL to your deployed frontend (HTTPS required)
Users can open your vault directly from Telegram
⚠️ Security & Notes
Session files give full access to your account → Keep them secure
For production: Add encryption for sessions + proper user authentication
Rate limit login endpoints if hosting publicly
Never share your api_id and api_hash
�

Made with ❤️ for Telegram Power Users
Star the repo if you find it useful! ⭐
�
```
