# WORKLY — Backlog e Estado de Execução

Última atualização: 20 de julho de 2026  
Branch de trabalho: `agent/ciclo-1-auditoria-estabilizacao`

## Legenda

- `[x]` concluído e comprovado por inspeção/alteração;
- `[-]` parcialmente concluído;
- `[ ]` por executar;
- `[!]` bloqueado por ambiente ou decisão;

## Progresso

### CICLO 1 — Auditoria e estabilização

- Concluídas: **7/12**
- Parciais: **3/12**
- Bloqueadas: **2/12**
- Estado: **não encerrar ainda**

O progresso global não deve ser marcado automaticamente como `12/96` enquanto lint, typecheck, testes e build não tiverem sido executados com sucesso num ambiente com checkout e dependências.

## CICLO 1 — Tasks

### 1. Analisar toda a estrutura do repositório

- [x] Estrutura principal identificada.
- [x] Frontend, dois backends e documentação existente mapeados.
- [x] Rotas e componentes principais inspecionados através do GitHub.

### 2. Identificar framework, linguagem, backend e base de dados

- [x] Expo/React Native/TypeScript identificados.
- [x] FastAPI identificado.
- [x] MongoDB/Motor identificados.
- [x] Backend modular demo identificado.

### 3. Identificar autenticação e armazenamento

- [x] JWT, bcrypt e HTTP Bearer no backend MongoDB.
- [x] SecureStore para token.
- [x] AsyncStorage para utilizador e preferências.
- [x] Biometria local identificada.
- [x] Contratos incompatíveis documentados.

### 4. Mapear ecrãs e rotas

- [x] Rotas globais mapeadas.
- [x] Tabs Worker mapeadas.
- [x] Tabs Company mapeadas.
- [x] Rotas legacy identificadas.

### 5. Listar botões, menus e links sem funcionamento

- [-] Botão de notificações Company sem ação identificado.
- [-] Check-in do cartão Worker apenas com `console.log` identificado.
- [-] Menus do perfil Worker sem `onPress` identificados.
- [-] Registo apresentado mas desativado identificado.
- [-] Placeholders Company identificados.
- [ ] Fazer passagem manual e2e em Android para garantir lista completa.

### 6. Identificar dados simulados ou estáticos

- [x] Utilizadores e token demo identificados.
- [x] Services Worker/Company com dados fixos identificados.
- [x] Métricas fixas em `server.py` identificadas.
- [x] Dados estáticos de obra e tarefas no frontend identificados.

### 7. Identificar páginas e componentes repetidos

- [-] Dois backends identificados.
- [-] Dois sistemas de tema identificados.
- [-] Dois estilos de botão identificados.
- [-] Gestão de equipas legacy e nova identificada.
- [ ] Executar análise de imports e duplicação num checkout local.

### 8. Corrigir erros que impedem a aplicação de iniciar

- [-] Criado o componente `Button` em falta.
- [-] Exportação de `Button` restaurada.
- [-] Exemplos de ambiente adicionados.
- [ ] Confirmar arranque real do Metro.
- [ ] Confirmar arranque real do backend escolhido.
- [ ] Remover outros bloqueadores encontrados pelos comandos.

### 9. Corrigir erros de compilação e dependências

- [!] Não foi possível executar instalação e compilação neste ambiente.
- [x] Script `typecheck` adicionado.
- [x] Script `build:web` adicionado.
- [ ] Executar `npm ci`.
- [ ] Executar `npm run lint`.
- [ ] Executar `npm run typecheck`.
- [ ] Executar `npm run build:web`.
- [ ] Executar `python -m compileall .`.
- [ ] Corrigir resultados e repetir até passar.

### 10. Criar `TASKS.md`

- [x] Criado.

### 11. Criar documentação da arquitetura atual

- [x] `docs/CURRENT_STATE.md` criado.
- [x] `docs/ARCHITECTURE.md` criado.
- [x] `docs/BETA_ROADMAP.md` criado.

### 12. Gerar build de desenvolvimento funcional

- [!] Bloqueado: sem checkout executável e sem dependências instaladas.
- [ ] Export web validado.
- [ ] Android iniciado em emulador/dispositivo.
- [ ] Backend staging acessível.
- [ ] Login Worker validado.
- [ ] Login Company validado.

## Validação do Ciclo 1

### Frontend

```bash
cd frontend
npm ci
npm run lint
npm run typecheck
npm run build:web
```

Estado atual: **não executado neste ambiente**.

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m compileall .
pytest
```

Estado atual: **não executado neste ambiente**.

### Arranque proposto para inspeção

Backend MongoDB atual:

```bash
cd backend
cp .env.example .env
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

Frontend:

```bash
cd frontend
cp .env.example .env
npm start
```

Nota: no Android Emulator, ajustar `EXPO_PUBLIC_API_URL` para `http://10.0.2.2:8000/api`.

## Alterações aplicadas nesta branch

- [x] `frontend/src/components/ui/Button.tsx` criado.
- [x] `Button` exportado pelo barrel de UI.
- [x] scripts `typecheck` e `build:web` adicionados.
- [x] `frontend/.env.example` criado.
- [x] `backend/.env.example` criado.
- [x] documentação de auditoria criada.

## Bloqueadores para o CICLO 2

### P0 — Escolher backend único

- [ ] Criar ADR.
- [ ] Definir entrada FastAPI oficial.
- [ ] Remover ou arquivar a entrada alternativa.
- [ ] Definir prefixo da API.

### P0 — Alinhar autenticação

- [ ] Um único request de login.
- [ ] Uma única estrutura de resposta.
- [ ] `/auth/me` funcional.
- [ ] ids e role derivados do token.
- [ ] remover token e credenciais demo dos fluxos reais.

### P0 — Alinhar endpoints Worker e Company

- [ ] `/worker/dashboard` persistente.
- [ ] `/worker/profile` persistente.
- [ ] `/worker/documents` persistente.
- [ ] `/worker/messages` persistente.
- [ ] `/worker/check-status`, `/checkin` e `/checkout` persistentes.
- [ ] `/company/dashboard` persistente.

### P1 — Fechar navegação e ações

- [ ] Notificações Company.
- [ ] Menus do perfil Worker.
- [ ] Decidir visibilidade de `history`.
- [ ] Substituir placeholders Company.
- [ ] Decidir se o registo entra na beta; ocultar se não entrar.
- [ ] Ligar check-in do dashboard ao fluxo funcional.

### P1 — Qualidade e CI

- [ ] Criar GitHub Actions.
- [ ] Lint frontend.
- [ ] TypeScript frontend.
- [ ] Build/export frontend.
- [ ] Black/flake8/mypy backend.
- [ ] Pytest backend.
- [ ] Testes de contrato entre frontend e backend.

## Critério para encerrar o CICLO 1

Marcar as 12 tasks como concluídas apenas quando:

1. lint passa;
2. typecheck passa;
3. testes existentes passam ou a ausência de testes está formalmente registada;
4. backend inicia e responde a `/health`;
5. frontend inicia;
6. uma build/export de desenvolvimento termina com sucesso;
7. todos os novos erros encontrados estão corrigidos ou classificados para o Ciclo 2.
