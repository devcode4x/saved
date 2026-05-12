from typing import Optional, List
from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    api_id: int
    api_hash: str
    phone: str
    password: Optional[str] = None  # 2FA password
    code: Optional[str] = None      # login code from Telegram
    phone_code_hash: Optional[str] = None  # returned from first /login call


class LoginResponse(BaseModel):
    status: str  # "code_required" | "password_required" | "ok"
    phone_code_hash: Optional[str] = None
    session_id: Optional[str] = None
    message: Optional[str] = None


class HealthResponse(BaseModel):
    connected: bool
    phone: Optional[str] = None
    user: Optional[dict] = None


class CreateMessage(BaseModel):
    text: str = Field(..., min_length=1, max_length=4096)
    tags: Optional[List[str]] = None


class MessageOut(BaseModel):
    id: int
    text: str
    date: str
    tags: List[str] = []


class MessageList(BaseModel):
    items: List[MessageOut]
    total: int
    limit: int
    offset: int


class Stats(BaseModel):
    total_messages: int
    with_tags: int
    unique_tags: int
    last_message_date: Optional[str] = None


class Ok(BaseModel):
    ok: bool = True
    message: Optional[str] = None
