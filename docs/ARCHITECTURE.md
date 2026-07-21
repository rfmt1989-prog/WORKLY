# WORKLY — Arquitetura Atual

Data: 20 de julho de 2026  
Tipo de documento: arquitetura **as-is**, não arquitetura pretendida

## 1. Visão geral

A Workly é atualmente um monorepositório informal com três blocos técnicos:

1. aplicação Expo/React Native;
2. backend FastAPI monolítico com MongoDB;
3. backend FastAPI modular alternativo com dados de demonstração.

```text
┌──────────────────────────────────────────────┐
│ Expo / React Native / Expo Router            │
│ Android · iOS · Web                          │
└───────────────────┬──────────────────────────┘
                    │ HTTP + JSON + Bearer token
                    ▼
        ┌───────────────────────────┐
        │ Escolha de backend ambígua│
        └─────────────┬─────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
┌───────────────────┐   ┌─────────────────────┐
│ backend/server.py │   │ backend/app/main.py │
│ /api              │   │ sem /api            │
│ MongoDB + JWT      │   │ dados em memória    │
└─────────┬─────────┘   └─────────────────────┘
          ▼
┌───────────────────┐
│ MongoDB           │
└───────────────────┘
```

## 2. Frontend

### 2.1 Stack

- Expo SDK 54;
- React 19;
- React Native 0.81;
- Expo Router 6;
- TypeScript 5.9 com `strict: true`;
- React Native Web;
- Expo SecureStore;
- AsyncStorage;
- Expo Local Authentication;
- Reanimated, Gesture Handler, SVG e WebView.

### 2.2 Estrutura

```text
frontend/
├── app/
│   ├── (company)/
│   ├── (worker)/
│   ├── (tabs)/
│   ├── chat/[id].tsx
│   ├── contract/[id].tsx
│   ├── index.tsx
│   ├── login.tsx
│   ├── notifications.tsx
│   └── teams.tsx
├── src/
│   ├── api/
│   ├── components/
│   ├── context/
│   ├── design/
│   ├── hooks/
│   ├── theme/
│   └── utils/
├── app.json
├── package.json
└── tsconfig.json
```

### 2.3 Navegação

O Expo Router utiliza grupos de rotas para os dois perfis:

- `/(worker)` — cinco tabs: início, obra, documentos, mensagens e perfil;
- `/(company)` — seis tabs: início, obras, trabalhadores, equipas, mensagens e perfil;
- `/(tabs)` — navegação anterior ainda existente.

A autenticação escolhe o destino através do campo `user.role` devolvido pelo backend.

### 2.4 Estado e persistência

Não existe uma biblioteca global de estado. O estado é gerido por:

- React Context para autenticação e tema;
- `useState` e hooks locais nos ecrãs;
- SecureStore para o token;
- AsyncStorage para utilizador e preferências locais.

### 2.5 Cliente HTTP

Ficheiro: `frontend/src/api/client.ts`

- base configurável por `EXPO_PUBLIC_API_URL`;
- fallback: `http://127.0.0.1:8000/api`;
- token guardado em memória pelo módulo;
- header `Authorization: Bearer <token>`;
- métodos GET, POST, PUT, PATCH e DELETE;
- parsing centralizado de erros.

Limitações atuais:

- sem timeout;
- sem cancelamento;
- sem refresh de token;
- sem retry controlado;
- sem validação de schema em runtime;
- sem tratamento específico para 401 global;
- endereço `127.0.0.1` não funciona num dispositivo físico e precisa de configuração por ambiente.

## 3. Backend A — `backend/server.py`

### 3.1 Papel atual

É a implementação que mais se aproxima de um backend persistente e operacional.

### 3.2 Características

- FastAPI;
- router global com prefixo `/api`;
- MongoDB através de Motor;
- JWT;
- bcrypt;
- modelos Pydantic definidos no mesmo ficheiro;
- rotas e lógica de negócio concentradas num ficheiro com mais de mil linhas.

### 3.3 Configuração obrigatória

```env
MONGO_URL=
DB_NAME=
JWT_SECRET_KEY=
JWT_ALGORITHM=
ACCESS_TOKEN_EXPIRE_MINUTES=
```

A leitura é feita com `os.environ[...]`; qualquer variável ausente impede o processo de iniciar.

### 3.4 Domínios observados

- autenticação e utilizadores;
- dashboard genérico por role;
- equipas e membros;
- projetos;
- mensagens e conversas;
- contratos e assinatura;
- check-in/check-out;
- disponibilidade;
- pesquisa.

### 3.5 Contrato de autenticação

Pedido:

```json
{
  "email": "user@example.com",
  "password": "..."
}
```

Resposta:

```json
{
  "token": "jwt",
  "user": {
    "id": "uuid",
    "role": "worker"
  }
}
```

Este contrato é compatível com o `AuthContext` atual.

### 3.6 Problemas estruturais

- ficheiro monolítico;
- acesso direto à base de dados dentro das rotas;
- valores de dashboard estáticos misturados com dados reais;
- sem versionamento de API;
- sem migrations ou bootstrap documentado;
- sem testes identificados;
- não expõe os endpoints específicos esperados pelos novos ecrãs Worker e Company.

## 4. Backend B — `backend/app/main.py`

### 4.1 Papel atual

É uma tentativa de arquitetura modular e serve como protótipo dos novos contratos de dashboard.

### 4.2 Estrutura

```text
backend/app/
├── main.py
├── models/
├── repositories/
├── routers/
├── schemas/
└── services/
```

### 4.3 Características

- routers por domínio;
- schemas Pydantic separados;
- services separados;
- respostas tipadas;
- endpoints Worker e Company específicos.

### 4.4 Limitações

- utilizadores em memória;
- passwords em texto simples no repositório demo;
- token demo não assinado;
- dados simulados;
- `worker_id=1` fixo;
- check-in guardado apenas no processo;
- sem MongoDB;
- sem autorização real;
- sem prefixo `/api`;
- contrato de login incompatível com o frontend.

### 4.5 Contrato de autenticação

Pedido:

```json
{
  "email": "worker@workly.pt",
  "password": "123456",
  "user_type": "worker"
}
```

Resposta:

```json
{
  "access_token": "workly_demo_token",
  "token_type": "bearer",
  "user_id": 1,
  "user_type": "worker",
  "company_id": null
}
```

## 5. Incompatibilidade central

### 5.1 Login

| Elemento | Frontend | `server.py` | `app/main.py` |
|---|---|---|---|
| Prefixo | `/api` por defeito | `/api` | nenhum |
| Campo de role no pedido | não enviado | não exigido | obrigatório |
| Token na resposta | `token` | `token` | `access_token` |
| Utilizador completo | `user` | `user` | não |

### 5.2 Dashboards novos

| Endpoint frontend | `server.py` | `app/main.py` |
|---|---|---|
| `/worker/dashboard` | não localizado | existe |
| `/worker/profile` | não localizado | existe |
| `/worker/documents` | não localizado | existe |
| `/worker/messages` | não localizado | existe |
| `/worker/check-status` | não localizado | existe |
| `/company/dashboard` | não localizado | existe |

Consequência: o login e os dashboards não podem funcionar simultaneamente sem gateway, adaptação ou consolidação.

## 6. Dados

### 6.1 MongoDB

Coleções inferidas a partir de `server.py`:

- `users`;
- `jobs`;
- `contracts`;
- `conversations`;
- `messages`;
- `checkins`;
- `projects`;
- `teams`.

### 6.2 Ficheiros e documentos

Não foi identificada uma implementação consolidada de armazenamento binário, upload, URLs assinadas ou controlo de versões de documentos. Existem estruturas de documentos no frontend e na API demo, mas não um fluxo completo de ficheiro.

## 7. Segurança

### Implementado

- passwords com bcrypt no backend MongoDB;
- JWT com expiração;
- Bearer token;
- token guardado em SecureStore;
- CORS limitado a origens locais conhecidas.

### Lacunas

- segredo e configuração sem validação amigável;
- sem refresh token;
- sem revogação de sessão;
- sem rate limiting;
- sem auditoria de ações;
- sem controlo granular de permissões;
- backend demo contém credenciais fixas;
- biometria do frontend faz login com credenciais demo em vez de desbloquear uma sessão local protegida;
- `LogBox.ignoreAllLogs(true)` reduz a visibilidade de falhas.

## 8. Build e distribuição

### Configuração existente

- package Android: `pt.workly.app`;
- bundle iOS: `pt.workly.app`;
- deep-link scheme: `workly`;
- nova arquitetura React Native ativa;
- web export configurado como `single`;
- autenticação local e splash configurados.

### Em falta para beta distribuível

- `eas.json` e perfis documentados, caso seja usado EAS;
- configuração de ambientes development/preview/production;
- CI;
- gestão de secrets;
- política de versões e build numbers;
- testes em dispositivo físico;
- validação Android de permissões, rede e biometria;
- backend de staging acessível por HTTPS.

## 9. Decisão arquitetural obrigatória no Ciclo 2

### Opção A — Consolidar em `backend/server.py`

Vantagens:

- preserva MongoDB, JWT e fluxos já implementados;
- contrato de login já coincide com o frontend;
- menor risco de perder funcionalidades antigas.

Trabalho necessário:

- modularizar gradualmente o ficheiro;
- criar os endpoints `/worker/*` e `/company/*` usados pelo frontend;
- remover valores estáticos;
- adicionar schemas e services.

### Opção B — Tornar `backend/app/main.py` a API única

Vantagens:

- arquitetura mais limpa;
- contratos dedicados aos novos dashboards;
- melhor separação de responsabilidades.

Trabalho necessário:

- integrar MongoDB;
- substituir autenticação demo por JWT/bcrypt;
- migrar todas as rotas de `server.py`;
- alinhar o prefixo `/api`;
- adaptar ou preservar o contrato do frontend.

### Recomendação para a beta

Usar `backend/server.py` como fonte funcional temporária e extrair módulos progressivamente, implementando os contratos novos sobre a base persistente. Esta opção tende a reduzir o risco e o volume de migração antes da beta. A decisão final deve ser registada num ADR no início do Ciclo 2.

## 10. Arquitetura alvo mínima para a beta

```text
frontend Expo
    │
    │ HTTPS /api/v1
    ▼
FastAPI único
├── auth
├── workers
├── companies
├── projects
├── teams
├── attendance
├── documents
└── messages
    │
    ├── MongoDB ou base definida
    └── armazenamento de ficheiros
```

Regras:

- uma única entrada FastAPI;
- um único contrato de autenticação;
- ids derivados do token, nunca fixos;
- schemas partilhados e documentados;
- dados demo apenas através de seed explícito;
- ambientes separados;
- health check, logs e testes automatizados.
