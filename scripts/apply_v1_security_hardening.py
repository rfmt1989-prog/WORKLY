from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    content = target.read_text(encoding="utf-8")
    if old not in content:
        raise SystemExit(f"Pattern not found in {path}: {old[:120]!r}")
    target.write_text(content.replace(old, new, 1), encoding="utf-8")


replace_once(
    "backend/app/main.py",
    '''TOKEN_TTL_SECONDS = 60 * 60 * 24 * 14\nGEOFENCE_RADIUS_M = 250.0\n''',
    '''TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7\nPASSWORD_ITERATIONS = 310_000\nLEGACY_PASSWORD_ITERATIONS = 180_000\nGEOFENCE_RADIUS_M = 250.0\n''',
)

replace_once(
    "backend/app/main.py",
    '''TOKEN_SECRET = os.getenv(\n    "WORKLY_TOKEN_SECRET",\n    "workly-demo-signing-key-not-for-production",\n).encode("utf-8")\n''',
    '''_configured_token_secret = os.getenv("WORKLY_TOKEN_SECRET", "").strip()\nif os.getenv("VERCEL_ENV") == "production" and len(_configured_token_secret) < 32:\n    raise RuntimeError("WORKLY_TOKEN_SECRET must be configured in production")\nTOKEN_SECRET = (\n    _configured_token_secret\n    or "workly-local-demo-signing-key-not-for-production"\n).encode("utf-8")\n''',
)

replace_once(
    "backend/app/main.py",
    '''    allow_origins=configured_origins,\n    allow_origin_regex=r"https://.*\\.vercel\\.app",\n    allow_credentials=False,\n''',
    '''    allow_origins=configured_origins,\n    allow_credentials=False,\n''',
)

replace_once(
    "backend/app/main.py",
    '''    content_base64: str = Field(min_length=1)\n''',
    '''    content_base64: str = Field(min_length=1, max_length=3_000_000)\n''',
)

replace_once(
    "backend/app/main.py",
    '''def _password_record(password: str) -> dict[str, str]:\n    salt = os.urandom(16)\n    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 180_000)\n    return {"salt": _b64encode(salt), "digest": _b64encode(digest)}\n\n\ndef _password_matches(password: str, record: dict[str, str]) -> bool:\n    salt = _b64decode(record["salt"])\n    expected = _b64decode(record["digest"])\n    supplied = hashlib.pbkdf2_hmac(\n        "sha256", password.encode("utf-8"), salt, 180_000\n    )\n    return hmac.compare_digest(supplied, expected)\n''',
    '''def _password_record(password: str) -> dict[str, str]:\n    salt = os.urandom(16)\n    digest = hashlib.pbkdf2_hmac(\n        "sha256", password.encode("utf-8"), salt, PASSWORD_ITERATIONS\n    )\n    return {\n        "salt": _b64encode(salt),\n        "digest": _b64encode(digest),\n        "iterations": str(PASSWORD_ITERATIONS),\n    }\n\n\ndef _password_matches(password: str, record: dict[str, str]) -> bool:\n    salt = _b64decode(record["salt"])\n    expected = _b64decode(record["digest"])\n    try:\n        iterations = int(record.get("iterations", str(LEGACY_PASSWORD_ITERATIONS)))\n    except (TypeError, ValueError):\n        return False\n    if iterations < 100_000 or iterations > 1_000_000:\n        return False\n    supplied = hashlib.pbkdf2_hmac(\n        "sha256", password.encode("utf-8"), salt, iterations\n    )\n    return hmac.compare_digest(supplied, expected)\n''',
)

print("V1 security hardening applied")
