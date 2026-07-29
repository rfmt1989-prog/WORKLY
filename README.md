# WORKLY

Aplicação Expo/React Native com API FastAPI.

## Arranque rápido no Windows

Na raiz do projeto, execute apenas:

```powershell
.\start-workly.ps1
```

O script prepara o projeto quando necessário, inicia apenas uma instância
de cada serviço e abre `http://localhost:8081/login`.

## Arranque manual

### 1. Backend

```bash
cd backend
python -m venv .venv

# Windows PowerShell
.\.venv\Scripts\Activate.ps1

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

A API fica disponível em:

- Health check: `http://127.0.0.1:8000/api/health`
- Swagger: `http://127.0.0.1:8000/docs`

### 2. Frontend

```bash
cd frontend
npm install
npm run web
```

Por defeito, o frontend usa `http://127.0.0.1:8000/api`.
Num telemóvel físico, defina `EXPO_PUBLIC_API_URL` com o IP local do
computador, por exemplo `http://192.168.1.50:8000/api`, antes de iniciar
o Expo.

## Contas de demonstração

| Perfil | Email | Palavra-passe |
| --- | --- | --- |
| Worker | `worker@workly.pt` | `123456` |
| Company | `company@workly.pt` | `123456` |

## Demonstração

A versão demo inclui 8 trabalhadores, 2 empresas, 3 obras e 2 equipas.
O perfil Company permite pesquisar trabalhadores, criar e atualizar obras,
gerir membros e líderes de equipa e consultar mensagens.

## Vercel

O projeto está preparado para um único deploy Vercel a partir da raiz:

- o Expo Web é exportado para `frontend/dist`;
- o FastAPI é publicado através de `api/index.py`;
- no browser, o frontend usa automaticamente a API no mesmo domínio.
