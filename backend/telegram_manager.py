"""
Thin Telethon wrapper. One client per phone (= per session file).
Clients are cached in memory; session is persisted to disk so users don't
re-login on every restart.
"""
from __future__ import annotations

import asyncio
import os
import re
from pathlib import Path
from typing import Dict, List, Optional

from telethon import TelegramClient
from telethon.errors import (
    SessionPasswordNeededError,
    PhoneCodeInvalidError,
    PhoneCodeExpiredError,
    FloodWaitError,
)
from telethon.tl.custom.message import Message

SESSIONS_DIR = Path(os.environ.get("SESSIONS_DIR", "./sessions")).resolve()
SESSIONS_DIR.mkdir(parents=True, exist_ok=True)

TAG_RE = re.compile(r"#([\w\d_]+)", re.UNICODE)


def extract_tags(text: str) -> List[str]:
    return list({m.group(1) for m in TAG_RE.finditer(text or "")})


def session_path(phone: str) -> str:
    safe = re.sub(r"[^\d+]", "", phone)
    return str(SESSIONS_DIR / f"{safe}")


class ClientHolder:
    """Holds one TelegramClient and its lock per phone."""

    def __init__(self, client: TelegramClient, api_id: int, api_hash: str, phone: str):
        self.client = client
        self.api_id = api_id
        self.api_hash = api_hash
        self.phone = phone
        self.lock = asyncio.Lock()


# session_id (= sanitized phone) -> ClientHolder
_clients: Dict[str, ClientHolder] = {}


def _sid(phone: str) -> str:
    return re.sub(r"[^\d+]", "", phone)


async def _ensure_client(api_id: int, api_hash: str, phone: str) -> ClientHolder:
    sid = _sid(phone)
    holder = _clients.get(sid)
    if holder and holder.client.is_connected():
        return holder
    client = TelegramClient(session_path(phone), api_id, api_hash)
    await client.connect()
    holder = ClientHolder(client, api_id, api_hash, phone)
    _clients[sid] = holder
    return holder


async def get_holder(session_id: str) -> Optional[ClientHolder]:
    holder = _clients.get(session_id)
    if not holder:
        return None
    if not holder.client.is_connected():
        await holder.client.connect()
    return holder


async def login_step(
    api_id: int,
    api_hash: str,
    phone: str,
    code: Optional[str] = None,
    password: Optional[str] = None,
    phone_code_hash: Optional[str] = None,
) -> dict:
    """
    Returns one of:
      {"status": "code_required", "phone_code_hash": "..."}
      {"status": "password_required", "session_id": "..."}
      {"status": "ok", "session_id": "..."}
    """
    holder = await _ensure_client(api_id, api_hash, phone)
    client = holder.client
    sid = _sid(phone)

    if await client.is_user_authorized():
        return {"status": "ok", "session_id": sid}

    if not code:
        sent = await client.send_code_request(phone)
        return {"status": "code_required", "phone_code_hash": sent.phone_code_hash}

    try:
        await client.sign_in(
            phone=phone,
            code=code,
            phone_code_hash=phone_code_hash,
        )
    except SessionPasswordNeededError:
        if not password:
            return {"status": "password_required", "session_id": sid}
        await client.sign_in(password=password)
    except (PhoneCodeInvalidError, PhoneCodeExpiredError) as e:
        raise ValueError(f"Invalid or expired code: {e}") from e
    except FloodWaitError as e:
        raise ValueError(f"Flood wait: try again in {e.seconds}s") from e

    return {"status": "ok", "session_id": sid}


async def logout(session_id: str) -> bool:
    holder = _clients.pop(session_id, None)
    if not holder:
        # also delete session file if present
        for p in SESSIONS_DIR.glob(f"{session_id}*"):
            try:
                p.unlink()
            except OSError:
                pass
        return False
    try:
        await holder.client.log_out()
    finally:
        try:
            await holder.client.disconnect()
        except Exception:
            pass
        for p in SESSIONS_DIR.glob(f"{session_id}*"):
            try:
                p.unlink()
            except OSError:
                pass
    return True


def msg_to_dict(m: Message) -> dict:
    text = m.message or ""
    return {
        "id": m.id,
        "text": text,
        "date": m.date.isoformat() if m.date else "",
        "tags": extract_tags(text),
    }


async def send_note(session_id: str, text: str, tags: Optional[List[str]] = None) -> dict:
    holder = await get_holder(session_id)
    if not holder:
        raise PermissionError("Not connected")
    body = text.strip()
    if tags:
        extra = " ".join(f"#{t.lstrip('#')}" for t in tags if t.strip())
        if extra and extra not in body:
            body = f"{body}\n\n{extra}"
    async with holder.lock:
        m = await holder.client.send_message("me", body)
    return msg_to_dict(m)


async def list_messages(session_id: str, limit: int = 50, offset: int = 0, q: Optional[str] = None) -> dict:
    holder = await get_holder(session_id)
    if not holder:
        raise PermissionError("Not connected")
    async with holder.lock:
        kwargs = {"entity": "me", "limit": limit, "add_offset": offset}
        if q:
            kwargs["search"] = q
        items = []
        async for m in holder.client.iter_messages(**kwargs):
            if m.message:
                items.append(msg_to_dict(m))
        # total estimate: get_messages with limit=0 returns total via .total
        total_res = await holder.client.get_messages("me", limit=0, search=q or None)
        total = getattr(total_res, "total", len(items))
    return {"items": items, "total": total, "limit": limit, "offset": offset}


async def get_message(session_id: str, message_id: int) -> Optional[dict]:
    holder = await get_holder(session_id)
    if not holder:
        raise PermissionError("Not connected")
    async with holder.lock:
        m = await holder.client.get_messages("me", ids=message_id)
    if not m:
        return None
    return msg_to_dict(m)


async def delete_message(session_id: str, message_id: int) -> bool:
    holder = await get_holder(session_id)
    if not holder:
        raise PermissionError("Not connected")
    async with holder.lock:
        res = await holder.client.delete_messages("me", message_ids=[message_id], revoke=True)
    return bool(res)


async def stats(session_id: str) -> dict:
    holder = await get_holder(session_id)
    if not holder:
        raise PermissionError("Not connected")
    async with holder.lock:
        total_res = await holder.client.get_messages("me", limit=0)
        total = getattr(total_res, "total", 0)
        # sample tags from latest 200 for a lightweight overview
        with_tags = 0
        all_tags: set[str] = set()
        last_date = None
        async for m in holder.client.iter_messages("me", limit=200):
            if not m.message:
                continue
            if last_date is None and m.date:
                last_date = m.date.isoformat()
            tags = extract_tags(m.message)
            if tags:
                with_tags += 1
                all_tags.update(tags)
    return {
        "total_messages": total,
        "with_tags": with_tags,
        "unique_tags": len(all_tags),
        "last_message_date": last_date,
    }


async def health(session_id: str) -> dict:
    holder = _clients.get(session_id)
    if not holder:
        return {"connected": False}
    if not holder.client.is_connected():
        await holder.client.connect()
    if not await holder.client.is_user_authorized():
        return {"connected": False, "phone": holder.phone}
    me = await holder.client.get_me()
    return {
        "connected": True,
        "phone": holder.phone,
        "user": {
            "id": me.id,
            "first_name": getattr(me, "first_name", None),
            "last_name": getattr(me, "last_name", None),
            "username": getattr(me, "username", None),
        },
    }
