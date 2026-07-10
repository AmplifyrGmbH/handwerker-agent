import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import create_tables
from routers import betriebe, chat
from routers import pipeline

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Handwerker Agent API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001",
        "https://handwerker.amplifyr-digital.ch",
        "https://ihr-ki-agent.ch",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pipeline.router, prefix="/api/v1/pipeline")
app.include_router(betriebe.router, prefix="/api/v1/betriebe")
app.include_router(chat.router, prefix="/api/v1/chat")


@app.on_event("startup")
async def startup():
    await create_tables()


@app.get("/health")
async def health():
    from database import AsyncSessionLocal
    from sqlalchemy import text
    async with AsyncSessionLocal() as db:
        await db.execute(text("SELECT 1"))
    return {"status": "ok"}
