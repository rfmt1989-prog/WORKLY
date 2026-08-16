"""Durable persistence bridge for the WORKLY operational state.

The Expo/Web client still consumes the existing dict-based domain payload while the
backend progressively normalizes identity and tenancy. PostgreSQL stores the demo
state, registered accounts, company memberships and invitations so Vercel cold
starts do not reset operational data or access-control configuration.
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
        self._memory_memberships: dict[tuple[str, str], dict[str, Any]] = {}
        self._memory_invitations: dict[str, dict[str, Any]] = {}

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
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS workly_company_memberships (
                id TEXT PRIMARY KEY,
                company_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                email TEXT NOT NULL,
                name TEXT NOT NULL,
                access_role TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'active',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE (company_id, user_id),
                UNIQUE (company_id, email)
            )
            """
        )
        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_workly_company_memberships_company
            ON workly_company_memberships (company_id, status)
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS workly_company_invitations (
                token TEXT PRIMARY KEY,
                company_id TEXT NOT NULL,
                email TEXT NOT NULL,
                name TEXT NOT NULL,
                access_role TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                invited_by TEXT NOT NULL,
                expires_at TIMESTAMPTZ NOT NULL,
                accepted_by TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )
        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_workly_company_invitations_company
            ON workly_company_invitations (company_id, status)
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

    def reset_access_cache(self) -> None:
        """Reset only in-memory ACL data used by tests/offline development."""
        if not self.enabled:
            self._memory_memberships.clear()
            self._memory_invitations.clear()

    def upsert_membership(self, membership: dict[str, Any]) -> dict[str, Any]:
        record = deepcopy(membership)
        key = (str(record["company_id"]), str(record["user_id"]))
        self._memory_memberships[key] = record
        if not self.enabled:
            return deepcopy(record)
        try:
            with self._connect() as conn:
                self._ensure_schema(conn)
                conn.execute(
                    """
                    INSERT INTO workly_company_memberships
                        (id, company_id, user_id, email, name, access_role, status, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
                    ON CONFLICT (company_id, user_id) DO UPDATE SET
                        email = EXCLUDED.email,
                        name = EXCLUDED.name,
                        access_role = EXCLUDED.access_role,
                        status = EXCLUDED.status,
                        updated_at = NOW()
                    """,
                    (
                        record["id"],
                        record["company_id"],
                        record["user_id"],
                        record["email"],
                        record["name"],
                        record["access_role"],
                        record.get("status", "active"),
                    ),
                )
                conn.commit()
            self.connected = True
            self.last_error = None
        except Exception as exc:
            self.connected = False
            self.last_error = type(exc).__name__
        return deepcopy(record)

    def get_membership(self, company_id: str, user_id: str) -> dict[str, Any] | None:
        key = (company_id, user_id)
        if not self.enabled:
            value = self._memory_memberships.get(key)
            return deepcopy(value) if value else None
        try:
            with self._connect() as conn:
                self._ensure_schema(conn)
                row = conn.execute(
                    """
                    SELECT id, company_id, user_id, email, name, access_role, status
                    FROM workly_company_memberships
                    WHERE company_id = %s AND user_id = %s
                    """,
                    (company_id, user_id),
                ).fetchone()
            self.connected = True
            self.last_error = None
            if not row:
                return None
            value = dict(zip(("id", "company_id", "user_id", "email", "name", "access_role", "status"), row))
            self._memory_memberships[key] = value
            return deepcopy(value)
        except Exception as exc:
            self.connected = False
            self.last_error = type(exc).__name__
            value = self._memory_memberships.get(key)
            return deepcopy(value) if value else None

    def list_memberships(self, company_id: str) -> list[dict[str, Any]]:
        if not self.enabled:
            return [
                deepcopy(value)
                for (stored_company, _), value in self._memory_memberships.items()
                if stored_company == company_id
            ]
        try:
            with self._connect() as conn:
                self._ensure_schema(conn)
                rows = conn.execute(
                    """
                    SELECT id, company_id, user_id, email, name, access_role, status
                    FROM workly_company_memberships
                    WHERE company_id = %s
                    ORDER BY name, email
                    """,
                    (company_id,),
                ).fetchall()
            self.connected = True
            self.last_error = None
            fields = ("id", "company_id", "user_id", "email", "name", "access_role", "status")
            values = [dict(zip(fields, row)) for row in rows]
            for value in values:
                self._memory_memberships[(company_id, str(value["user_id"]))] = value
            return deepcopy(values)
        except Exception as exc:
            self.connected = False
            self.last_error = type(exc).__name__
            return [
                deepcopy(value)
                for (stored_company, _), value in self._memory_memberships.items()
                if stored_company == company_id
            ]

    def delete_membership(self, company_id: str, user_id: str) -> bool:
        self._memory_memberships.pop((company_id, user_id), None)
        if not self.enabled:
            return True
        try:
            with self._connect() as conn:
                self._ensure_schema(conn)
                conn.execute(
                    "DELETE FROM workly_company_memberships WHERE company_id = %s AND user_id = %s",
                    (company_id, user_id),
                )
                conn.commit()
            self.connected = True
            self.last_error = None
            return True
        except Exception as exc:
            self.connected = False
            self.last_error = type(exc).__name__
            return False

    def create_invitation(self, invitation: dict[str, Any]) -> dict[str, Any]:
        record = deepcopy(invitation)
        self._memory_invitations[str(record["token"])] = record
        if not self.enabled:
            return deepcopy(record)
        try:
            with self._connect() as conn:
                self._ensure_schema(conn)
                conn.execute(
                    """
                    INSERT INTO workly_company_invitations
                        (token, company_id, email, name, access_role, status, invited_by, expires_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
                    ON CONFLICT (token) DO UPDATE SET
                        access_role = EXCLUDED.access_role,
                        status = EXCLUDED.status,
                        expires_at = EXCLUDED.expires_at,
                        updated_at = NOW()
                    """,
                    (
                        record["token"],
                        record["company_id"],
                        record["email"],
                        record["name"],
                        record["access_role"],
                        record.get("status", "pending"),
                        record["invited_by"],
                        record["expires_at"],
                    ),
                )
                conn.commit()
            self.connected = True
            self.last_error = None
        except Exception as exc:
            self.connected = False
            self.last_error = type(exc).__name__
        return deepcopy(record)

    def get_invitation(self, token: str) -> dict[str, Any] | None:
        if not self.enabled:
            value = self._memory_invitations.get(token)
            return deepcopy(value) if value else None
        try:
            with self._connect() as conn:
                self._ensure_schema(conn)
                row = conn.execute(
                    """
                    SELECT token, company_id, email, name, access_role, status,
                           invited_by, expires_at, accepted_by
                    FROM workly_company_invitations
                    WHERE token = %s
                    """,
                    (token,),
                ).fetchone()
            self.connected = True
            self.last_error = None
            if not row:
                return None
            fields = ("token", "company_id", "email", "name", "access_role", "status", "invited_by", "expires_at", "accepted_by")
            value = dict(zip(fields, row))
            value["expires_at"] = value["expires_at"].isoformat() if hasattr(value["expires_at"], "isoformat") else str(value["expires_at"])
            self._memory_invitations[token] = value
            return deepcopy(value)
        except Exception as exc:
            self.connected = False
            self.last_error = type(exc).__name__
            value = self._memory_invitations.get(token)
            return deepcopy(value) if value else None

    def list_invitations(self, company_id: str) -> list[dict[str, Any]]:
        if not self.enabled:
            return [
                deepcopy(value)
                for value in self._memory_invitations.values()
                if value.get("company_id") == company_id and value.get("status") == "pending"
            ]
        try:
            with self._connect() as conn:
                self._ensure_schema(conn)
                rows = conn.execute(
                    """
                    SELECT token, company_id, email, name, access_role, status,
                           invited_by, expires_at, accepted_by
                    FROM workly_company_invitations
                    WHERE company_id = %s AND status = 'pending'
                    ORDER BY created_at DESC
                    """,
                    (company_id,),
                ).fetchall()
            self.connected = True
            self.last_error = None
            fields = ("token", "company_id", "email", "name", "access_role", "status", "invited_by", "expires_at", "accepted_by")
            values = []
            for row in rows:
                value = dict(zip(fields, row))
                value["expires_at"] = value["expires_at"].isoformat() if hasattr(value["expires_at"], "isoformat") else str(value["expires_at"])
                self._memory_invitations[str(value["token"])] = value
                values.append(value)
            return deepcopy(values)
        except Exception as exc:
            self.connected = False
            self.last_error = type(exc).__name__
            return [
                deepcopy(value)
                for value in self._memory_invitations.values()
                if value.get("company_id") == company_id and value.get("status") == "pending"
            ]

    def consume_invitation(self, token: str, user_id: str) -> bool:
        value = self._memory_invitations.get(token)
        if value:
            value["status"] = "accepted"
            value["accepted_by"] = user_id
        if not self.enabled:
            return bool(value)
        try:
            with self._connect() as conn:
                self._ensure_schema(conn)
                result = conn.execute(
                    """
                    UPDATE workly_company_invitations
                    SET status = 'accepted', accepted_by = %s, updated_at = NOW()
                    WHERE token = %s AND status = 'pending'
                    """,
                    (user_id, token),
                )
                conn.commit()
            self.connected = True
            self.last_error = None
            return result.rowcount > 0
        except Exception as exc:
            self.connected = False
            self.last_error = type(exc).__name__
            return bool(value)

    def delete_invitation(self, company_id: str, token: str) -> bool:
        value = self._memory_invitations.get(token)
        if value and value.get("company_id") == company_id:
            self._memory_invitations.pop(token, None)
        if not self.enabled:
            return True
        try:
            with self._connect() as conn:
                self._ensure_schema(conn)
                conn.execute(
                    "DELETE FROM workly_company_invitations WHERE company_id = %s AND token = %s",
                    (company_id, token),
                )
                conn.commit()
            self.connected = True
            self.last_error = None
            return True
        except Exception as exc:
            self.connected = False
            self.last_error = type(exc).__name__
            return False
