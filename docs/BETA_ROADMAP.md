# WORKLY — Roadmap para Beta

Data: 20 de julho de 2026  
Objetivo: disponibilizar uma beta Android testável com autenticação, dados persistentes e fluxos principais Worker/Company funcionais.

## Estado de entrada

A aplicação possui uma base visual avançada, mas ainda não existe um percurso completo e coerente entre login, backend, base de dados e novos dashboards.

A prioridade da beta não deve ser acrescentar mais ecrãs. Deve ser fechar uma arquitetura funcional mínima e tornar cada ação apresentada ao utilizador realmente executável.

## Critérios de saída da beta

A beta só deve ser considerada pronta quando todos os pontos seguintes forem verdadeiros:

- frontend instala, inicia e compila sem erros;
- existe um único backend oficial;
- login Worker e Company funciona com utilizadores persistidos;
- sessão é restaurada e validada;
- dashboard Worker usa dados reais;
- dashboard Company usa dados reais;
- check-in/check-out fica persistido e visível para a Company;
- obras, trabalhadores e equipas deixam de ser placeholders;
- documentos podem ser listados, abertos e descarregados;
- todos os botões visíveis têm ação, estado desativado explícito ou indicação de indisponibilidade;
- lint, typecheck, testes e build passam em CI;
- existe backend de staging HTTPS;
- existe distribuição beta Android através de Play Console Internal Testing ou canal equivalente;
- política de privacidade, termos e dados de suporte estão disponíveis.

## Prioridades

### P0 — Bloqueia qualquer beta funcional

1. Escolher o backend oficial.
2. Unificar prefixo, autenticação e contratos JSON.
3. Fazer login Worker e Company com dados persistentes.
4. Corrigir todos os erros de lint e TypeScript.
5. Criar testes mínimos de autenticação e health check.
6. Garantir build Android de desenvolvimento.
7. Configurar ambiente de staging.

### P1 — Fluxos essenciais da beta

1. Dashboard Worker real.
2. Dashboard Company real.
3. CRUD de obras.
4. CRUD de trabalhadores associados à empresa.
5. CRUD de equipas e atribuição a obras.
6. Check-in/check-out persistente.
7. Monitorização de presenças pela Company.
8. Documentos e certificados consultáveis.
9. Perfil Worker e Company editável.
10. Mensagens mínimas funcionais.

### P2 — Qualidade operacional

1. Notificações.
2. Estados vazios e mensagens de erro consistentes.
3. Upload de fotografia e remoção de fundo, caso seja requisito final.
4. Analytics e observabilidade.
5. Auditoria de ações.
6. Exportação de relatórios.
7. Localização e idiomas.
8. Melhorias de animação e performance.

### P3 — Pós-beta

1. IA operacional;
2. marketplace;
3. faturação avançada;
4. parceiros e clientes externos;
5. academia e formação;
6. integrações com ERP e payroll;
7. análise preditiva.

## Sequência recomendada de ciclos

## CICLO 2 — Backend único e autenticação

### Objetivo

Eliminar a duplicação de backends e criar um contrato único e persistente.

### Entregáveis

- ADR com a decisão do backend oficial;
- uma única aplicação FastAPI inicializável;
- prefixo `/api/v1` ou `/api` definido;
- login, registo opcional, `/auth/me` e logout local;
- MongoDB configurado;
- seeds de Worker e Company para staging;
- documentação OpenAPI coerente;
- testes de autenticação;
- frontend alinhado com o contrato.

### Bloqueadores recebidos do Ciclo 1

- `server.py` e `app/main.py` incompatíveis;
- frontend depende de ambos;
- `AuthContext.refresh()` vazio;
- registo apresentado mas desativado;
- credenciais biométricas demo.

## CICLO 3 — Worker operacional

### Objetivo

Tornar o percurso Worker utilizável de ponta a ponta.

### Entregáveis

- dashboard Worker real;
- perfil editável;
- obra atual real;
- horários;
- check-in/check-out persistente;
- histórico;
- documentos e certificados;
- mensagens básicas;
- estados de loading, vazio e erro;
- testes dos fluxos principais.

## CICLO 4 — Company operacional

### Objetivo

Substituir os placeholders da Company por gestão real.

### Entregáveis

- dashboard Company;
- lista e detalhe de obras;
- lista e detalhe de trabalhadores;
- equipas;
- atribuição de equipas e trabalhadores a obras;
- visualização de check-ins em tempo quase real;
- perfil Company;
- mensagens;
- permissões por empresa.

## CICLO 5 — Documentos, certificados e conformidade

### Objetivo

Permitir consultar e gerir documentos de forma segura.

### Entregáveis

- upload;
- armazenamento de ficheiros;
- metadata;
- validade e expiração;
- visualização e download;
- certificados separados;
- alertas;
- permissões;
- retenção e auditoria;
- política de privacidade e termos.

## CICLO 6 — Qualidade, segurança e observabilidade

### Objetivo

Transformar o protótipo numa beta controlável.

### Entregáveis

- CI;
- testes frontend e backend;
- logging estruturado;
- crash reporting;
- métricas;
- tratamento global de erros;
- timeouts e retry;
- validação de autorização;
- rate limiting;
- gestão de secrets;
- remoção de `LogBox.ignoreAllLogs(true)` em desenvolvimento.

## CICLO 7 — Build Android e Play Store Beta

### Objetivo

Distribuir uma versão testável a utilizadores reais.

### Entregáveis

- perfis development/preview/production;
- package e signing confirmados;
- ícone, splash e screenshots;
- política de privacidade publicada;
- ficha Play Store;
- formulário Data Safety;
- testes internos;
- correções de dispositivo real;
- release notes;
- rollout interno.

## Plano imediato de execução

### Passo 1 — Fechar o Ciclo 1 num ambiente com checkout

```bash
cd frontend
npm ci
npm run lint
npm run typecheck
npm run build:web
```

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m compileall .
pytest
```

Depois iniciar o backend escolhido e validar `/health`.

### Passo 2 — Abrir o Ciclo 2

A primeira task deve ser criar um ADR com a escolha entre:

- consolidar `backend/server.py`; ou
- migrar totalmente para `backend/app/main.py`.

Não devem ser implementadas novas funcionalidades antes desta decisão.

### Passo 3 — Criar contrato de API

Definir e congelar temporariamente:

- login;
- utilizador autenticado;
- dashboard Worker;
- dashboard Company;
- check-in/check-out;
- documentos;
- mensagens.

### Passo 4 — Criar CI

Pipeline mínimo:

1. instalar dependências;
2. lint frontend;
3. typecheck frontend;
4. export web ou validação Metro;
5. compileall backend;
6. flake8/black check;
7. pytest.

## Riscos principais

| Risco | Impacto | Mitigação |
|---|---|---|
| Continuar a desenvolver sobre dois backends | Muito alto | Decisão ADR no início do Ciclo 2 |
| UI avançar mais rápido que dados reais | Alto | Critérios de aceitação por fluxo end-to-end |
| Ausência de CI | Alto | Pipeline no Ciclo 2/6 antes de beta |
| Check-in sem validação de localização | Alto | Regras de presença e auditoria antes de produção |
| Documentos sem armazenamento seguro | Alto | Serviço de ficheiros e permissões no Ciclo 5 |
| Credenciais demo em fluxos reais | Alto | Seeds separados e remoção de hardcodes |
| Falhas escondidas pelo LogBox | Médio/alto | Logs ativos em desenvolvimento |
| Publicação sem documentação legal | Alto | Política e Data Safety antes de Play Store |

## Definição de prioridade para novas ideias

Uma nova característica só entra antes da beta se cumprir pelo menos uma condição:

- desbloqueia login ou operação principal;
- permite ao Worker executar trabalho real;
- permite à Company monitorizar trabalho real;
- é exigida pela Play Store ou por segurança;
- reduz falhas críticas ou suporte manual.

Animações, IA, marketplace, faturação avançada e personalização visual adicional devem ficar depois dos fluxos P0 e P1.
