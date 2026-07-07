# WORKLY — Product Requirements Document

## Original Problem Statement
Build a premium workforce management mobile app (WORKLY) for Europe that feels as polished as Uber, Airbnb, Stripe, Notion. Native iOS/Android feel, Material 3 + Apple HIG. Dark/Light/Offline modes, Push Notifications, Face ID/Fingerprint. Bottom nav: Home, Search, Messages, Contracts, Profile. Four role variants (Worker, Company, Staffing, Team Manager) with rich feature sets (dashboards, trust score, jobs, check-in/out, career timeline, achievements, contracts w/ digital signature, chat with voice/docs, etc.).

## User Choices (MVP)
- Both Worker + Company via role selector at login
- JWT email/password auth
- No AI integration
- Realistic seed data + real backend
- Premium monochrome + sage-green theme (Dark + Light), agent's discretion

## Architecture
- **Frontend:** Expo SDK 54 + expo-router (file-based). Contexts: Auth (JWT via expo-secure-store), Theme (light/dark/system). react-native-svg (trust ring, signature), expo-blur (tab bar), expo-local-authentication (Face ID), Ionicons. Theme tokens in `src/theme/theme.ts`.
- **Backend:** FastAPI + motor (MongoDB), PyJWT + bcrypt. All routes `/api/*`. UUID string ids (no ObjectId leakage). Seed via `POST /api/seed`.

## Personas
- **Worker (João Silva):** finds jobs, checks in/out, signs contracts, builds career.
- **Company (BuildCorp Europe):** searches talent, manages projects, contracts.

## Implemented (2026-07-07)
- Login with role selector (Worker/Company), register, Face ID/biometric login, demo-fill, theme toggle.
- Role-based Home dashboard: Trust ring, level progress, stats, today's jobs w/ GPS chips, Check In/Out FAB (worker); spend/projects/stats (company).
- Search: debounced, filter chips (horizontal scroller), workers (company) / job listings (worker).
- Messages: conversation list + chat (text, voice waveform, document bubbles, optimistic send, video/voice call buttons).
- Contracts: filtered list + detail (status timeline, digital signature canvas via SVG PanResponder, download PDF, renew).
- Profile: cover, trust ring, availability toggle, skills bars, certificates, portfolio, languages/countries, theme selector, logout.
- Career: trust ring, achievements grid, training progress, vertical timeline.
- Notifications: typed feed with mark-as-read.
- Full dark/light theming across all screens. 43/43 backend tests passing.

## Backlog / Remaining
- **P1:** Staffing App + Team Manager App role variants (Manage Workers/Teams, Attendance, Safety Reports, Daily Reports). Real GPS navigation + map. Real voice recording (expo-audio) & document picker uploads (object storage). Video calls.
- **P1:** Offline mode caching, Push Notifications (needs deploy + build + google-services.json).
- **P2:** 2FA, encrypted documents, invoices/payments screens, analytics/ratings for company, calendar view, certificates upload, video introduction.

## Next Tasks
1. Build Staffing & Team Manager role dashboards.
2. Wire real GPS map + document/photo uploads (object storage).
3. Payments/Invoices + Analytics screens.
