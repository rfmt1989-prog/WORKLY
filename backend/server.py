"""Compatibility entry point for ``uvicorn server:app``."""

from app.main import app

__all__ = ["app"]
