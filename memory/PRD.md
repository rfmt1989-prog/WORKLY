# WORKLY — Estado do Produto

## Objetivo atual

Disponibilizar uma demonstração web completa de uma plataforma operacional para
trabalhadores e empresas, mantendo a base React Native compatível com Android e
iOS.

## Perfis

- **Worker:** gere perfil, competências, certificados, disponibilidade,
  contratos, documentos, obras, horários e check-in/check-out.
- **Company:** pesquisa e consulta trabalhadores, gere perfil, equipas, líderes,
  membros, obras, atribuições, documentos e monitorização de presenças.

## Arquitetura implementada

- **Frontend:** Expo SDK 54, React Native Web, Expo Router e TypeScript.
- **Estado:** contexto autenticado e snapshot local versionado para preservar a
  demonstração após refresh/cold start.
- **Backend:** FastAPI sem dependências externas, tokens HMAC e seed
  determinístico.
- **Deploy:** exportação Expo Web estática e FastAPI serverless no mesmo projeto
  Vercel.

## Dados demo

- 8 trabalhadores: eletricista, canalizador, soldador, técnica AVAC, montador de
  estruturas, nacellista/IPAF, operador de máquinas e encarregado.
- 2 empresas: construção/estruturas e instalações técnicas.
- 3 obras, 2 equipas, líderes, membros e registos de presença.
- Documentos, contratos, certificados e projetos fictícios consultáveis.

## Limites assumidos da demonstração

- Os dados não usam uma base de dados partilhada; o servidor mantém estado em
  memória e o browser/dispositivo mantém o seu próprio snapshot persistente.
- GPS real depende da permissão e suporte do browser; existe fallback explícito
  para localização simulada.
- Documentos e contratos têm conteúdo demonstrativo e não são ficheiros legais.
- Notificações push, pagamentos, uploads reais e comunicação em tempo real não
  pertencem ao âmbito desta demonstração.
