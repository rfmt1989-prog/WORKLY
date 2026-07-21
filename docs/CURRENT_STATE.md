# WORKLY — Estado Atual do Projeto

Data da auditoria: 20 de julho de 2026  
Branch auditada: `main` (`f62a86014cb5723a874b0e50836cda34845aefa7`)  
Escopo: CICLO 1 — Auditoria e estabilização

## Resumo executivo

O repositório contém uma aplicação móvel/web em Expo e React Native, um backend FastAPI monolítico ligado a MongoDB e uma segunda implementação FastAPI modular baseada maioritariamente em dados simulados.

A interface visual já contém uma base relevante para Worker e Company, mas o projeto ainda não está pronto para ser classificado como beta funcional. O principal bloqueador é a coexistência de dois contratos de API incompatíveis: nenhuma das duas entradas de backend satisfaz, isoladamente, todos os pedidos atualmente efetuados pelo frontend.

Nesta auditoria foi corrigido um bloqueador estático de compilação no ecrã de login: o componente `Button` era importado, mas não existia nem era exportado.

## Limitação da validação

A auditoria foi efetuada através da integração GitHub. O ambiente de execução desta análise não tinha o repositório montado e não conseguiu clonar diretamente o GitHub, pelo que não foi possível instalar dependências nem executar localmente lint, TypeScript, testes, Metro ou uma build Expo.

Os comandos foram adicionados ao `frontend/package.json` para permitir a validação no ambiente de desenvolvimento:

```bash
cd frontend
npm ci
npm run lint
npm run typecheck
npm run build:web
```

O Ciclo 1 só deve ser marcado como totalmente concluído depois desses comandos serem executados e os resultados registados em `TASKS.md`.

## Estrutura técnica observada

```text
WORKLY/
├── backend/
│   ├── server.py                 # API MongoDB/JWT com prefixo /api
│   ├── requirements.txt
│   └── app/                      # Segunda API modular, sobretudo demonstrativa
│       ├── main.py
│       ├── models/
│       ├── repositories/
│       ├── routers/
│       ├── schemas/
│       └── services/
├── frontend/
│   ├── app/                      # Rotas Expo Router
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── design/
│   │   ├── hooks/
│   │   ├── theme/
│   │   └── utils/
│   ├── app.json
│   ├── package.json
│   └── tsconfig.json
└── docs/
```

## Tecnologias identificadas

### Frontend

- Expo SDK 54;
- React 19;
- React Native 0.81;
- Expo Router 6;
- TypeScript em modo `strict`;
- AsyncStorage para dados locais não sensíveis;
- Expo SecureStore para token;
- Expo Local Authentication para biometria;
- React Native Reanimated, Gesture Handler e SVG.

### Backend principal existente

Ficheiro: `backend/server.py`

- Python e FastAPI;
- MongoDB através de Motor;
- JWT através de PyJWT;
- passwords com bcrypt;
- API com prefixo `/api`;
- autenticação real baseada em utilizadores guardados em MongoDB;
- rotas de equipas, projetos, mensagens, contratos, check-in e pesquisa no mesmo ficheiro.

### Backend modular alternativo

Ficheiro: `backend/app/main.py`

- FastAPI organizado por routers, schemas e services;
- sem prefixo global `/api`;
- autenticação demonstrativa com utilizadores em memória;
- token demonstrativo;
- dados de Worker e Company maioritariamente estáticos;
- endpoints dedicados como `/worker/dashboard`, `/worker/profile` e `/company/dashboard`.

## Autenticação e armazenamento

O frontend envia `POST /auth/login` relativamente à base configurada em `EXPO_PUBLIC_API_URL`. O valor por defeito inclui `/api`, pelo que o pedido final é `POST /api/auth/login`.

O contexto de autenticação espera a resposta:

```json
{
  "token": "...",
  "user": {
    "id": "...",
    "name": "...",
    "email": "...",
    "role": "worker"
  }
}
```

Este contrato coincide com `backend/server.py`, mas não coincide com `backend/app/main.py`, que exige `user_type` e devolve `access_token`, `user_id` e `user_type`.

A sessão é guardada em:

- `workly_token` no SecureStore;
- `workly_user` no AsyncStorage;
- `workly_last_email` no AsyncStorage.

O método `refresh()` ainda não valida a sessão em `/auth/me`.

## Mapa de ecrãs e rotas

### Globais e legado

| Rota | Estado observado |
|---|---|
| `/` | Redireciona para `/login` |
| `/login` | Interface completa; login depende do backend; registo desativado |
| `/dashboard` | Redireciona diretamente para Company |
| `/(tabs)` | Navegação antiga ainda presente |
| `/teams` | Ecrã extenso de gestão de equipas fora do novo grupo Company |
| `/chat/[id]` | Rota declarada |
| `/contract/[id]` | Rota declarada |
| `/career` | Rota declarada |
| `/notifications` | Rota declarada |

### Worker

| Rota | Estado observado |
|---|---|
| `/(worker)` | Dashboard visual completo; depende de `/worker/dashboard` |
| `/(worker)/project` | Check-in/check-out implementado contra endpoints da API modular |
| `/(worker)/documents` | Interface extensa; dados dependem da API modular |
| `/(worker)/messages` | Interface extensa; dados dependem da API modular |
| `/(worker)/profile` | Perfil e logout; menus internos sem ação |
| `/(worker)/history` | Ecrã existente, mas não aparece na tab bar Worker |

### Company

| Rota | Estado observado |
|---|---|
| `/(company)` | Dashboard visual; depende de `/company/dashboard` |
| `/(company)/projects` | Placeholder visual |
| `/(company)/workers` | Placeholder visual |
| `/(company)/teams` | Placeholder visual |
| `/(company)/messages` | Placeholder visual |
| `/(company)/profile` | Perfil visual com várias informações estáticas |

## Botões, menus e ações incompletas identificados

1. O botão de notificações do dashboard Company é um `Pressable` sem `onPress`.
2. O check-in no cartão do dashboard Worker apenas escreve no `console.log`; o check-in funcional está noutro ecrã.
3. Todos os itens de menu no perfil Worker são `Pressable` sem ação.
4. O registo é apresentado na interface, mas `AuthContext.register()` lança sempre uma exceção de funcionalidade indisponível.
5. `AuthContext.refresh()` não executa qualquer pedido.
6. Os separadores Company de obras, trabalhadores, equipas e mensagens abrem apenas placeholders.
7. A rota `history` existe no Worker, mas não está exposta na navegação principal.
8. O login biométrico utiliza credenciais demo fixas, sem associação segura à última sessão autenticada.
9. `LogBox.ignoreAllLogs(true)` esconde erros e avisos importantes durante desenvolvimento.
10. Existem duas experiências de gestão de equipas: `/teams` e `/(company)/teams`, sendo a segunda apenas um placeholder.

## Dados simulados ou estáticos

### Backend modular

- utilizadores demo e passwords em memória;
- token demo;
- Worker fixo com `worker_id=1`;
- dados fixos de perfil, documentos, trabalhos, mensagens, obra atual e empresa;
- estado de check-in guardado apenas em memória do processo;
- dashboard Company com métricas e projetos simulados.

### Backend MongoDB

Apesar de utilizar MongoDB, ainda devolve vários valores fixos, incluindo ganhos mensais, número de trabalhos concluídos, trabalhadores contratados, contratos abertos e faturas pendentes.

### Frontend

- horário, chefe de equipa, tamanho da equipa e tarefas diárias no ecrã da obra;
- textos e métricas de fallback;
- credenciais demo;
- versão visual `0.4.0` no perfil, enquanto `app.json` e `package.json` indicam `1.0.0`.

## Componentes e fluxos repetidos

- dois sistemas de tema: `src/design` e `src/theme/theme`;
- dois conjuntos de componentes de botão: `Button` e `LedButton`;
- duas arquiteturas de backend concorrentes;
- ecrã antigo de equipas e novo separador Company de equipas;
- dashboards antigos e novos coexistem nas rotas;
- componentes grandes com estilos inline repetidos em vários ecrãs.

## Bloqueadores críticos da beta

### P0 — Contrato de API impossível de satisfazer com uma única entrada

- `backend/server.py` satisfaz o login do frontend em `/api/auth/login`, mas não expõe os endpoints `/api/worker/*` e `/api/company/dashboard` utilizados pelos novos dashboards.
- `backend/app/main.py` expõe `/worker/*` e `/company/dashboard`, mas não usa `/api` e o contrato de login é diferente.

É necessária uma decisão no Ciclo 2: consolidar tudo em `backend/server.py` ou tornar `backend/app/main.py` a única entrada e migrar autenticação, MongoDB e restantes rotas.

### P0 — Validação executável ainda em falta

Não existe CI ativo no commit auditado e não foi possível executar localmente:

- `npm run lint`;
- `npm run typecheck`;
- `npm run build:web`;
- testes backend;
- arranque real de MongoDB/FastAPI;
- arranque Metro/Expo.

### P1 — Ambiente não documentado anteriormente

`backend/server.py` termina imediatamente se as variáveis obrigatórias não existirem. Foram adicionados:

- `backend/.env.example`;
- `frontend/.env.example`.

### P1 — Cobertura de testes inexistente ou não localizada

As dependências incluem `pytest`, mas não foi localizado um conjunto de testes automatizados nem scripts de teste frontend.

## Correções aplicadas no Ciclo 1

- criado `frontend/src/components/ui/Button.tsx`;
- exportado `Button` em `frontend/src/components/ui/index.ts`;
- adicionados scripts `typecheck` e `build:web`;
- adicionados exemplos de configuração de ambiente;
- criada documentação do estado atual, arquitetura e roadmap da beta;
- criado backlog auditável em `TASKS.md`.

## Resultado atual

O repositório está melhor documentado e um bloqueador evidente de compilação foi removido. A aplicação ainda não deve ser declarada funcional ou pronta para beta até existir uma única API coerente e os comandos de validação serem executados com sucesso.
