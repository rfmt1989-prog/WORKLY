"""Durable persistence bridge for the WORKLY operational state.

The current application still exposes the existing dict-based domain model to keep
the Expo/Web demo stable. When a PostgreSQL connection URL is present, this module
stores that state and registered accounts in PostgreSQL so Vercel cold starts do not
reset the product. This bridge is intentionally small and can later be replaced by
normalized multi-tenant tables without changing the frontend contract.
"""

from __future__ import annotations

import os
from copy import deepcopy
from typing import Any

try:
    import psycopg
    from psycopg.types.json import Jsonb
except ImportError:  # pragma: no cover - dependency is installed in production/CI
    psycopg = None
    Jsonb = None


DATABASE_ENV_KEYS = (
    "DATABASE_URL",
    "POSTGRES_URL",
    "NEON_DATABASE_URL",
    "NEON_POSTGRES_URL",
)


def resolve_database_url() -> str | None:
    for key in DATABASE_ENV_KEYS:
        value = os.getenv(key, "").strip()
        if value:
            return value
    return None


class PersistenceStore:
    def __init__(self, database_url: str | None = None) -> None:
        self.database_url = database_url or resolve_database_url()
        self.connected = False
        self.last_error: str | None = None

    @property
    def enabled(self) -> bool:
        return bool(self.database_url)

    @property
    def mode(self) -> str:
        return "postgres" if self.enabled else "memory"

    def health(self) -> dict[str, Any]:
        return {
            "mode": self.mode,
            "configured": self.enabled,
            "connected": self.connected,
            "status": "ready" if self.connected else ("not_configured" if not self.enabled else "degraded"),
        }

    def _connect(self):
        if not self.enabled:
            raise RuntimeError("PostgreSQL is not configured")
        if psycopg is None:
            raise RuntimeError("psycopg is not installed")
        return psycopg.connect(self.database_url, connect_timeout=5)

    @staticmethod
    def _ensure_schema(conn) -> None:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS workly_runtime_state (
                id SMALLINT PRIMARY KEY CHECK (id = 1),
                payload JSONB NOT NULL,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS workly_registered_users (
                email TEXT PRIMARY KEY,
                payload JSONB NOT NULL,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )

    def load(
        self,
        default_state: dict[str, Any],
    ) -> tuple[dict[str, Any], dict[str, dict[str, Any]]]:
        fallback = deepcopy(default_state)
        if not self.enabled:
            return fallback, {}
        try:
            with self._connect() as conn:
                self._ensure_schema(conn)
                row = conn.execute(
                    "SELECT payload FROM workly_runtime_state WHERE id = 1"
                ).fetchone()
                if row is None:
                    conn.execute(
                        "INSERT INTO workly_runtime_state (id, payload) VALUES (1, %s)",
                        (Jsonb(fallback),),
                    )
                    state = fallback
                else:
                    state = row[0]
                user_rows = conn.execute(
                    "SELECT email, payload FROM workly_registered_users"
                ).fetchall()
                conn.commit()
            self.connected = True
            self.last_error = None
            return deepcopy(state), {
                str(email): deepcopy(payload) for email, payload in user_rows
            }
        except Exception as exc:  # keep the public demo available if storage is degraded
            self.connected = False
            self.last_error = type(exc).__name__
            return fallback, {}

    def save(
        self,
        state: dict[str, Any],
        registered_users: dict[str, dict[str, Any]],
    ) -> bool:
        if not self.enabled:
            return False
        try:
            with self._connect() as conn:
                self._ensure_schema(conn)
                conn.execute(
                    """
                    INSERT INTO workly_runtime_state (id, payload, updated_at)
                    VALUES (1, %s, NOW())
                    ON CONFLICT (id) DO UPDATE
                    SET payload = EXCLUDED.payload, updated_at = NOW()
                    """,
                    (Jsonb(state),),
                )
                conn.execute("DELETE FROM workly_registered_users")
                if registered_users:
                    conn.executemany(
                        """
                        INSERT INTO workly_registered_users (email, payload, updated_at)
                        VALUES (%s, %s, NOW())
                        """,
                        [
                            (email, Jsonb(payload))
                            for email, payload in registered_users.items()
                        ],
                    )
                conn.commit()
            self.connected = True
            self.last_error = None
            return True
        except Exception as exc:  # preserve availability and expose degraded state in /health
            self.connected = False
            self.last_error = type(exc).__name__
            return False
