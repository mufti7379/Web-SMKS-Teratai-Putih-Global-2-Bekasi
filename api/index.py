"""Vercel Python entrypoint. Vercel auto-detects any ASGI/WSGI `app` object under /api,
so this just imports the real FastAPI app from backend/ (which isn't on sys.path by
default in the serverless bundle)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from server import app  # noqa: E402
