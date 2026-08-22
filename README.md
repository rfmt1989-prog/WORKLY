# WORKLY

Demonstração funcional de gestão de força de trabalho, construída com
React Native/Expo/TypeScript e FastAPI/Python. A mesma base do frontend corre
na web, Android e iOS; no Vercel, o frontend estático e a API serverless usam o
mesmo domínio.

## Contas de demonstração

| Perfil | Email | Password |
| --- | --- | --- |
| Worker | `worker.demo@workly.app` | `WorklyDemo!` |
| Company | `company.demo@workly.app` | `WorklyDemo!` |

A página de login inclui botões diretos para os dois perfis.

## O que está incluído

- Registo, login por perfil, sessão persistente e logout.
- Perfis Worker e Company completos e editáveis.
- Tema escuro responsivo, com identidade azul para Worker e vermelha para
  Company.
- Dashboards por perfil, indicadores de confiança e produtividade e estados de
  disponibilidade.
- Pesquisa e detalhe de 8 trabalhadores de diferentes profissões.
- Gestão de equipas, membros, líderes e associação a obras.
- CRUD de obras e atribuição de equipas e trabalhadores.
- Check-in/check-out com GPS quando disponível e localização demo como fallback.
- Horários, histórico de presenças e monitorização Company.
- Documentos, contratos, certificados e melhores projetos consultáveis.
- Sincronização automática Worker–Company com o servidor como fonte principal.
- Idiomas português, inglês, francês, espanhol, romeno, alemão e neerlandês.
- Seed determinístico com 2 empresas, 3 obras, 2 equipas e presenças.

## Arquitetura

```text
frontend/                 Expo Router + React Native Web
  app/login.tsx           Autenticação e entradas demo
  app/workspace.tsx       Aplicação autenticada
  src/components/workspace
  src/context             Sessão, cache e sincronização com a API
backend/
  app/main.py             API FastAPI
  app/demo_data.py        Seed determinístico
  tests/                  Testes dos fluxos principais
pyproject.toml            Dependências e entrypoint FastAPI no Vercel
vercel.json               Build web e configuração serverless
```

O PostgreSQL mantém o estado operacional entre cold starts e dispositivos. O
cliente conserva uma cache local apenas para acelerar o primeiro ecrã e volta a
reconciliar os dados com o servidor a cada 4 segundos. Uma alteração só é
apresentada como concluída depois de ser aceite pela API.

## Arranque rápido no Windows

Na raiz:

```powershell
.\start-workly.ps1
```

O script prepara as dependências, inicia a API na porta `8000`, o Expo na porta
`8081` e abre a página de login.

## Arranque manual

Backend:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

No Windows, ative o ambiente com `.venv\Scripts\Activate.ps1`.

Frontend:

```bash
cd frontend
npm ci
npm run web -- --port 8081
```

Por defeito, o frontend local usa `http://127.0.0.1:8000/api`. Para testar num
telemóvel físico, copie `.env.example` para um ficheiro local ignorado pelo Git
e defina `EXPO_PUBLIC_API_URL` com o IP LAN do computador.

## Verificação

```bash
cd frontend
npx tsc --noEmit
npm run lint
npm run build:web

cd ..
pytest -q backend/tests
```

Endpoints úteis:

- API health: `http://127.0.0.1:8000/api/health`
- Swagger: `http://127.0.0.1:8000/docs`

## Deploy

O repositório está preparado para um projeto Vercel na raiz. O export web é
regenerado pelo build de produção e o entrypoint `backend.app.main:app` é
publicado como função FastAPI. O frontend usa `/api` no mesmo domínio. Em
produção, `DATABASE_URL` liga a aplicação ao PostgreSQL partilhado.

Nunca devem ser colocados segredos no repositório. Defina
`WORKLY_TOKEN_SECRET` no ambiente do Vercel e mantenha as credenciais do
PostgreSQL apenas nas variáveis protegidas do projeto.
