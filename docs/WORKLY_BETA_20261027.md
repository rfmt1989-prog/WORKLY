# Workly: imagem empresarial, segurança e testes Android

Estado revisto em 27 de outubro de 2026. Este é um plano de execução e preparação técnica; não confirma a publicação de uma app no Google Play.

## 1. Imagem empresarial

A entrada com monograma W e login unificado está na proposta #45. O perfil profissional, a progressão, as provas e o passaporte PDF estão na branch `feature/single-profession-skill-tree` (#44). Antes de uma beta conjunta, integrar e testar as duas alterações, preservando o registo de identidade e o WORKLY ID público.

Direção visual: W como símbolo principal, fundo de entrada já aprovado, azul acinzentado e superfícies claras integradas. Manter poucas cores, evitar cartões brancos e efeito fosco, apresentar fotografia e profissão primeiro, e mostrar apenas o badge principal de cada árvore recolhida. Os ícones da app, arranque, PDF e ficha da loja devem usar a mesma identidade.

A apresentação deve explicar o benefício: identidade profissional, percurso comprovado e acesso organizado a documentos e obras. Selos de verificação só aparecem quando existe validação efetiva. Nomes, contactos, entidade responsável e dados de suporte devem ser confirmados pelo proprietário; não são inventados nesta preparação.

## 2. Segurança

Correções incluídas nesta proposta:

- O arranque da API preserva contas e perfis já guardados quando muda a geração dos dados de demonstração. Não há reposição automática do armazenamento.
- Todos os ambientes alojados Vercel, incluindo previews, exigem uma chave de assinatura configurada com pelo menos 32 caracteres. A chave local de desenvolvimento nunca pode assinar sessões alojadas. Não foi alterada nenhuma chave existente.
- A compilação `play-internal` rejeita uma API local, HTTP, com credenciais no URL, ou os aliases conhecidos da produção. O endereço de testes é fornecido explicitamente.

Pontos ainda por fechar antes de testes com documentos reais ou lançamento alargado:

| Ponto | Trabalho necessário |
| --- | --- |
| Tentativas de login | Limite persistente entre instâncias, respostas que não revelem contas e monitorização de abuso. |
| Sessões | Revogação no servidor, recuperação de palavra-passe e revisão do comportamento offline. |
| Dados e documentos | Confirmar autorização em cada download e separação entre Worker, empresas e colaboradores; verificar restauração de backups. |
| Partilha pública | Controlo explícito do que é partilhado pelo QR/ID e prazo dos links. |
| Privacidade | Identificar responsável e contacto, publicar informação coerente com o tratamento real dos dados e implementar pedido de eliminação na app e na web. |
| Identidade única | Resolver concorrência de registos entre instâncias; não confundir conta/email/documento declarado com pessoa civil verificada. |

Esta revisão é focada nos caminhos de arranque, assinatura e preparação da beta; não é uma auditoria completa de segurança.

## 3. Google Play: teste interno

A loja é o Google Play. O primeiro destino será a faixa de teste interno, que admite até 100 testers. Isto é diferente do teste fechado exigido para pedir acesso à produção em contas pessoais novas: pelo menos 12 testers inscritos continuamente durante 14 dias. O requisito não é uma espera para iniciar o teste interno.

Preparação incluída:

- Perfil EAS `play-internal`, formato AAB, distribuição `store` e pacote `pt.workly.app`.
- O APK direto mantém o perfil `preview` e o pacote separado `pt.workly.app.beta`.
- Numeração de compilações gerida remotamente; `play-internal` incrementa a versão de build.
- Submissão configurada para a faixa `internal`, inicialmente em rascunho.
- Workflow manual `Android Play Internal AAB`, que compila, mas não envia nem publica na loja.

### Passos para obter o AAB

1. Integrar e validar a versão que se pretende testar, incluindo a nova entrada. Confirmar a API de teste correspondente e a respetiva persistência/configuração de segurança.
2. Confirmar o acesso ao projeto Expo existente `@maia239/workly`, sem criar outro projeto.
3. Preparar as credenciais Android de `pt.workly.app` no Expo. Se o pacote já existir no Google Play, reutilizar a chave de upload adequada; não gerar uma substituta. A última execução Android observada em 17/10/2026 falhou porque tentava gerar um keystore em modo não interativo. A falta de `expo-updates` também foi assinalada; o canal já foi retirado da configuração atual.
4. Para a configuração inicial, executar o build interativo no computador autenticado do proprietário, depois de configurar `EXPO_PUBLIC_API_URL` no ambiente EAS `preview`:

```sh
cd frontend
npx --yes eas-cli@16.28.0 build --platform android --profile play-internal
```

5. Para builds seguintes, usar o workflow `Android Play Internal AAB` no código revisto, indicar a API HTTPS de testes e manter `EXPO_TOKEN` no ambiente protegido `android-beta`. O workflow fornece a API ao build remoto e conserva os controlos de acesso desse ambiente.
6. Descarregar o AAB do resultado do build. Verificar instalação, login, permissões, leitura de documentos e exportação PDF num Android real.

### Passos no Google Play Console

1. Confirmar a conta de programador, o tipo de conta e a verificação exigida. Não foi confirmado acesso a esta conta nesta sessão.
2. Criar/abrir a app Workly com o pacote correspondente e rever a configuração de assinatura antes do primeiro envio.
3. Em Testar e lançar → Testes → Teste interno, criar uma versão, enviar o AAB e adicionar notas de versão.
4. Selecionar os testers, rever o lançamento e obter o link de adesão. Criar uma compilação não cria esse link.
5. Preparar descrição, screenshots e contactos reais. Para teste fechado/produção, concluir as declarações aplicáveis, classificação e ficha da loja, incluindo Segurança dos dados e recursos de privacidade/eliminação de conta. O teste interno tem requisitos de configuração mais reduzidos.

Com a conta de serviço Google configurada no EAS, o envio também pode usar:

```sh
npx --yes eas-cli@16.28.0 submit --platform android --profile play-internal
```

O perfil envia para rascunho na faixa interna; a publicação para testers é um passo separado no Console. Não colocar chaves de serviço no repositório.

## Referências oficiais

- [Google: testes internos, fechados e abertos](https://support.google.com/googleplay/android-developer/answer/9845334?hl=en)
- [Google: testes de contas pessoais novas](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)
- [Google: eliminação de contas](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en)
- [Expo: envio para o Google Play](https://docs.expo.dev/submit/android/)
- [Expo: versões das compilações](https://docs.expo.dev/build-reference/app-versions/)
