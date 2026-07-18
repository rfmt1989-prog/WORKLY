# EN-001 — Architecture

## Visão geral

A Workly será organizada por domínios de negócio e responsabilidades técnicas.

## Aplicações

### Frontend

- React Native;
- Expo;
- Expo Router;
- TypeScript;
- suporte web, Android e iOS.

### Backend

- Python;
- FastAPI;
- autenticação baseada em token;
- API REST;
- serviços modulares.

### Dados

- base de dados documental na fase atual;
- possibilidade de migração ou coexistência com base relacional para faturação, contratos e auditoria;
- armazenamento de ficheiros separado da base de dados.

## Domínios

- Identity;
- Companies;
- Workers;
- Teams;
- Projects;
- Planning;
- Documents;
- Contracts;
- Insurance;
- Safety;
- Attendance;
- Communication;
- Partners;
- Analytics;
- AI.

## Frontend

```text
frontend/
├── app/
├── src/
│   ├── api/
│   ├── components/
│   ├── design/
│   ├── features/
│   ├── hooks/
│   ├── context/
│   ├── services/
│   ├── types/
│   └── utils/