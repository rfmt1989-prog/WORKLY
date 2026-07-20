# WORKLY

Aplicação de gestão de trabalho e equipas com experiências próprias para trabalhador e empresa. O projeto funciona localmente em web, Android e iOS através de Expo, com uma API FastAPI autónoma e dados de demonstração.

## Windows — arranque recomendado

No PowerShell, na raiz do repositório:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1
```

Terminal 1 — API:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-backend.ps1
```

Terminal 2 — aplicação web:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-frontend.ps1
```

Abrir `http://localhost:8081`. A documentação da API fica em `http://localhost:8000/docs`.

## macOS e Linux

### Preparação

Na raiz do repositório:

```bash
make install
```

### Arrancar a aplicação

Terminal 1 — API:

```bash
make backend
```

Terminal 2 — aplicação web:

```bash
make frontend
```

Abrir `http://localhost:8081`. A documentação da API fica em `http://localhost:8000/docs`.

## Contas de demonstração

| Perfil | Email | Palavra-passe |
| --- | --- | --- |
| Trabalhador | `demo@workly.pt` | `123456` |
| Empresa | `company@workly.pt` | `123456` |

Também é possível criar uma conta a partir do ecrã de autenticação. Os dados deste MVP são mantidos em memória e reiniciam quando a API é desligada.

## Dashboards unificados

- **Worker:** um único perfil profissional com as áreas Início, Info, Skills, Obras, Docs e Chat. A fotografia do trabalhador é um recorte transparente e o ambiente visual muda com a área selecionada.
- **Company:** um único centro de operações com Início, Obras, Pessoas, Equipas, Chat e Empresa. As listas permitem selecionar registos, consultar detalhes e abrir conversas sem menus duplicados.
- Notificações, logout, conversas, seleção de obras, trabalhadores e equipas estão ligados. Se a API ainda estiver a iniciar, os dashboards e o chat mantêm dados de demonstração funcionais.

## Comandos úteis

```bash
make test   # testes da API
make check  # lint, TypeScript e testes
```

Para abrir em Android ou iOS, usar respetivamente `npm run android` ou `npm run ios` dentro de `frontend/`, com a API já iniciada.

## Estrutura

- `frontend/` — Expo SDK 54, React Native, Expo Router e TypeScript.
- `backend/` — FastAPI, serviços modulares e API REST em `/api`.
- `docs/` — visão, estratégia, produto e arquitetura.
- `design_guidelines.json` — princípios visuais do produto.
