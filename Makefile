.PHONY: install backend frontend test check

install:
	python3 -m venv --copies .venv
	.venv/bin/pip install -r backend/requirements.txt
	cd frontend && npm ci

backend:
	cd backend && ../.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

frontend:
	cd frontend && npm run web

test:
	cd backend && ../.venv/bin/pytest -q

check:
	cd frontend && npm run lint
	cd frontend && npx tsc --noEmit
	cd backend && ../.venv/bin/pytest -q
