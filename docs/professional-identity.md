# Identidade profissional Workly

Cada conta Worker tem um perfil, com um identificador estável e uma profissão principal. Alterar o nome, a profissão ou o percurso atualiza esse perfil. Um registo com o mesmo email normalizado devolve 409; a verificação e a criação ficam na mesma secção crítica.

O perfil reúne identificação, idiomas, localização, experiência, disponibilidade, competências declaradas, certificações e portefólio. O valor pedido para o worker é uma pontuação profissional, sem preço monetário.

## Pontuação da profissão principal

| Critério | Pontos por registo | Limite |
| --- | ---: | ---: |
| Certificação profissional verificada, da área e dentro da validade | 10 | 50 |
| Comprovativo verificado de uma competência adicional, associado à área | 4 | 20 |
| Obra do portefólio confirmada pela empresa na área | 10 | 30 |

| Nível interno Workly | Pontuação mínima |
| --- | ---: |
| Aprendiz | 0 |
| Júnior | 20 |
| Profissional | 40 |
| Especialista | 65 |
| Master | 85 |

Sem obras confirmadas, o máximo é 70. Master requer, por construção da fórmula, certificações e obras confirmadas. Certificados duplicados com o mesmo nome e emissor não dão pontos adicionais. Certificados expirados, com datas inválidas, emitidos no futuro, por validar ou de outra área não contam.

Experiência, percentagens de skills e obras declaradas podem ser apresentadas no perfil; não atribuem pontos automaticamente. A pontuação é calculada no servidor e não pode ser editada pelo worker ou pela empresa. Uma empresa com `workers.manage` e acesso ao worker pode confirmar um certificado com um ficheiro pertencente a esse worker, ou confirmar uma obra do portefólio. O servidor regista quem confirmou. Uma alteração feita pelo worker a um registo confirmado retira a confirmação.

Os comprovativos são classificados como certificação da profissão ou competência adicional na mesma árvore. Alterar a profissão mantém o ID e os registos anteriores, mas a pontuação passa a considerar apenas os comprovativos e obras associados à nova área.

## Limites desta versão

A classificação é interna à Workly; não substitui uma qualificação emitida por uma entidade certificadora. A unicidade é por conta/email, não por pessoa civil verificada. Impedir uma pessoa de usar emails diferentes exige um fluxo de verificação de identidade. O mecanismo de persistência existente continua a guardar um snapshot JSON; o bloqueio de registos nesta alteração cobre o processo local, sem introduzir uma transação global entre instâncias Vercel.

## Validação

Os testes da API cobrem a estabilidade do perfil após edição e novo login, email duplicado, pontuação e limites, comprovativos expirados/duplicados/de outra profissão, confirmação pela empresa, proibição de autoavaliação e perda de confirmação após edição. A web mantém o fluxo Expo existente.
