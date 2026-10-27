"""Signing-key requirements for hosted Workly environments."""

from __future__ import annotations

import os
from collections.abc import Mapping


def token_signing_secret(environment: Mapping[str, str] | None = None) -> bytes:
    values = os.environ if environment is None else environment
    configured = values.get("WORKLY_TOKEN_SECRET", "").strip()
    hosted = bool(values.get("VERCEL_ENV")) or values.get("VERCEL") == "1"
    if hosted and len(configured) < 32:
        raise RuntimeError(
            "WORKLY_TOKEN_SECRET must contain at least 32 characters in hosted environments"
        )
    # This fallback is only for local development; it can never sign hosted sessions.
    return (configured or "workly-local-demo-signing-key-not-for-production").encode("utf-8")
