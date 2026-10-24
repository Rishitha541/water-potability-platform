"""FastAPI entry point."""
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401  (registers the tables)
from app.database import Base, engine
from app.routers import predict, reports, hotspots
# from app.routers import reports, hotspots   # uncomment in the next batch

load_dotenv(Path(__file__).parent.parent / ".env")

Base.metadata.create_all(bind=engine)  # creates tables on first run

app = FastAPI(title="Water Potability & Citizen Reporting API")

# FRONTEND_URL can hold several comma-separated URLs (local + Vercel)
origins = [u.strip() for u in os.getenv("FRONTEND_URL", "").split(",") if u.strip()]
origins.append("http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict.router)
app.include_router(reports.router)
app.include_router(hotspots.router)


@app.get("/health")
def health():
    return {"status": "ok"}