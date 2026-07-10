import time
from collections import defaultdict
from typing import Any

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from services import gemini_client

router = APIRouter()

# Simple in-memory rate limiter (works with single-worker uvicorn)
_rate_store: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT = 30       # requests
RATE_WINDOW = 60      # seconds
MAX_MSG_LEN = 2000


def _check_rate_limit(ip: str) -> bool:
    now = time.time()
    _rate_store[ip] = [t for t in _rate_store[ip] if now - t < RATE_WINDOW]
    if len(_rate_store[ip]) >= RATE_LIMIT:
        return False
    _rate_store[ip].append(now)
    return True


class ChatRequest(BaseModel):
    message: str
    history: list[dict[str, Any]] = []


@router.post("/message")
async def chat_message(req: ChatRequest, request: Request):
    ip = request.client.host if request.client else "unknown"

    if not _check_rate_limit(ip):
        raise HTTPException(status_code=429, detail="Zu viele Anfragen. Bitte warten Sie kurz.")

    if len(req.message) > MAX_MSG_LEN:
        raise HTTPException(status_code=400, detail="Nachricht zu lang.")

    reply = gemini_client.chat_response(req.message, req.history)
    return {"reply": reply}
