# WORKLY — Backlog e Estado de Execução

Última atualização: 20 de julho de 2026  
Branch: `agent/ciclo-1-auditoria-estabilizacao`

## CICLO 1 — Auditoria e estabilização

Estado: **validação técnica concluída; falta teste manual do frontend**.

### Tasks

1. [x] Estrutura do repositório analisada.
2. [x] Stack identificada: Expo, React Native, TypeScript, FastAPI e MongoDB.
3. [x] Autenticação e armazenamento identificados: JWT, bcrypt, SecureStore e AsyncStorage.
4. [x] Ecrãs e rotas mapeados.
5. [-] Botões, menus e ligações sem ação identificados por inspeção; falta passagem manual final.
6. [x] Dados simulados e estáticos identificados.
7. [-] Duplicações principais identificadas: dois backends, dois temas, dois sistemas de botões e rotas legacy.
8. [-] Bloqueadores de arranque corrigidos; falta confirmar o frontend em execução.
9. [x] Erros de compilação e dependências corrigidos.
10. [x] `TASKS.md` criado e atualizado.
11. [x] Arquitetura e estado atual documentados.
12. [-] Build web funcional; falta smoke test manual Worker e Company.

## Resultados comprovados

### Frontend

- Expo Doctor: **18/18 checks passed**.
- TypeScript: **0 erros**.
- Lint: **0 erros e 5 warnings não bloqueadores**.
- Build web: **Exported: dist**.

### Backend

- `python -m compileall .`: concluído sem erros.
- `app.main`: iniciou e `/health` respondeu 200.
- `server.py`: iniciou e serviu a API `/api`.
- Pytest: **43 passed in 1.52s**.

## Correções aplicadas

- componente `Button` restaurado e exportado;
- erros TypeScript corrigidos;
- erro bloqueador de lint corrigido;
- scripts `typecheck` e `build:web` adicionados;
- fixture de testes alinhada com `EXPO_PUBLIC_API_URL`;
- exemplos de ambiente criados;
- `docs/CURRENT_STATE.md`, `docs/ARCHITECTURE.md` e `docs/BETA_ROADMAP.md` criados.

## Teste final para encerrar o Ciclo 1

Backend:

```powershell
cd C:\Users\rfmt1\WORKLY\backend
.\.venv\Scripts\Activate.ps1
uvicorn server:app --reload --host 127.0.0.1 --port 8000
```

Frontend, noutro terminal:

```powershell
cd C:\Users\rfmt1\WORKLY\frontend
npm start -- --clear
```

Validar manualmente:

- aplicação abre sem ecrã vermelho;
- login Worker abre a área Worker;
- login Company abre a área Company;
- tabs principais abrem;
- logout regressa ao login.

## Bloqueadores transferidos para o Ciclo 2

### P0

- escolher e consolidar um único backend;
- alinhar prefixo e contratos da API;
- alinhar autenticação e `/auth/me`;
- ligar endpoints Worker e Company a dados persistentes.

### P1

- concluir ações e navegação sem funcionamento;
- substituir placeholders Company;
- eliminar páginas e componentes repetidos;
- eliminar warnings restantes;
- criar CI e testes de contrato.
