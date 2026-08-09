"""Vercel ASGI entrypoint for the WORKLY FastAPI backend.

The production web client is a static Expo export. Vercel routes /api/* to this
single function and passes the original API path through the __path query
parameter; this wrapper restores that path before delegating to FastAPI.
"""

from __future__ import annotations

from urllib.parse import parse_qs

from backend.app.main import app as workly_app


async def app(scope, receive, send):
    if scope.get("type") != "http":
        await workly_app(scope, receive, send)
        return

    query_string = scope.get("query_string", b"")
    try:
        query = parse_qs(query_string.decode("utf-8"), keep_blank_values=True)
    except (UnicodeDecodeError, AttributeError):
        query = {}

    forwarded_path = query.get("__path", [""])[0].strip("/")
    api_path = "/api" + (f"/{forwarded_path}" if forwarded_path else "")

    forwarded_scope = dict(scope)
    forwarded_scope["path"] = api_path
    forwarded_scope["raw_path"] = api_path.encode("utf-8")

    await workly_app(forwarded_scope, receive, send)
