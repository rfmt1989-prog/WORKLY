# WORKLY Infrastructure

## Production

- Frontend: Expo / React Native Web, exported as static web output on Vercel.
- API: FastAPI exposed under `/api` as a Vercel Python function.
- Database: Neon PostgreSQL connected to the Vercel production environment.
- Database resource: `workly-postgres`.
- Region: Frankfurt (`fra1`).
- Plan: Neon Free (`free_v3`).
- Connection: application reads `DATABASE_URL` automatically; `POSTGRES_URL` and Neon-compatible aliases remain supported.

## Persistence bridge

The current API keeps the existing WORKLY domain contract while persisting the operational state and registered accounts in PostgreSQL. This allows gradual migration to normalized multi-tenant tables without breaking the Expo/Web clients.

## Next architecture milestone

Normalize persistence into tenant-scoped tables for companies, users, workers, projects, teams, attendance, documents, certificates, contracts and audit events, with explicit role-based access controls.
