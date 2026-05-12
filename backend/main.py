from __future__ import annotations

import os
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import telegram_manager as tm
from models import (
    CreateMessage,
    HealthResponse,
    LoginRequest,
    LoginResponse,
    MessageList,
    MessageOut,
    Ok,
    Stats,
)

load_dotenv()

# ==================== CONFIG ====================
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.environ.get(
        "ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if o.strip()
]

# Fallback for local development
if not ALLOWED_ORIGINS:
    ALLOWED_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]

app = FastAPI(
    title="Telegram Saved Vault API",
    description="Use your own Telegram Saved Messages as a personal database.",
    version="1.0.0",
)

# ==================== CORS (Fixed + Cloudflare Tunnel Support) ====================
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https?://.*\.trycloudflare\.com",  # Supports both http & https
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)


# ---------- helpers ----------

async def require_session(x_session_id: Optional[str] = Header(None)) -> str:
    if not x_session_id:
        raise HTTPException(status_code=401, detail="Missing X-Session-Id header")
    holder = await tm.get_holder(x_session_id)
    if not holder or not await holder.client.is_user_authorized():
        raise HTTPException(status_code=401, detail="Not connected. Please log in.")
    return x_session_id


# ---------- root ----------

@app.get("/")
def root():
    return {
        "name": "Telegram Saved Vault API",
        "docs": "/docs",
        "health": "/api/health",
    }


# ---------- auth ----------

@app.post("/api/login", response_model=LoginResponse)
async def login(payload: LoginRequest):
    try:
        result = await tm.login_step(
            api_id=payload.api_id,
            api_hash=payload.api_hash,
            phone=payload.phone,
            code=payload.code,
            password=payload.password,
            phone_code_hash=payload.phone_code_hash,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Login failed: {e}")
    return LoginResponse(**result)


@app.post("/api/logout", response_model=Ok)
async def logout(session_id: str = Depends(require_session)):
    await tm.logout(session_id)
    return Ok(message="Logged out")


@app.get("/api/health", response_model=HealthResponse)
async def health(x_session_id: Optional[str] = Header(None)):
    if not x_session_id:
        return HealthResponse(connected=False)
    return HealthResponse(**await tm.health(x_session_id))


# ---------- stats ----------

@app.get("/api/stats", response_model=Stats)
async def stats(session_id: str = Depends(require_session)):
    return Stats(**await tm.stats(session_id))


# ---------- messages ----------

@app.post("/api/messages", response_model=MessageOut)
async def create_message(body: CreateMessage, session_id: str = Depends(require_session)):
    try:
        return MessageOut(**await tm.send_note(session_id, body.text, body.tags))
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/messages", response_model=MessageList)
async def list_messages(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    q: Optional[str] = Query(None, max_length=200),
    session_id: str = Depends(require_session),
):
    try:
        return MessageList(**await tm.list_messages(session_id, limit, offset, q))
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/messages/{message_id}", response_model=MessageOut)
async def get_message(message_id: int, session_id: str = Depends(require_session)):
    msg = await tm.get_message(session_id, message_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    return MessageOut(**msg)


@app.delete("/api/messages/{message_id}", response_model=Ok)
async def delete_message(message_id: int, session_id: str = Depends(require_session)):
    ok = await tm.delete_message(session_id, message_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Message not found or not deleted")
    return Ok(message="Deleted")


# ---------- search shortcut ----------

@app.get("/api/search", response_model=MessageList)
async def search(
    q: str = Query(..., min_length=1, max_length=200),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    session_id: str = Depends(require_session),
):
    return MessageList(**await tm.list_messages(session_id, limit, offset, q))


# ---------- error handler ----------

@app.exception_handler(PermissionError)
async def _perm(_, exc):
    return JSONResponse(status_code=401, content={"detail": str(exc)})