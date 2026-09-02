# Especificações

Cada mudança de comportamento começa por um documento aqui. Não é burocracia:
é o lugar onde a decisão fica registrada **antes** de virar código, com
critérios de aceite que depois viram teste.

## Como funciona

1. Copie `0000-modelo.md` para `NNNN-nome-curto.md`, numerando em sequência.
2. Preencha problema, decisão e critérios de aceite. Um critério que não dá
   para verificar não é critério — é intenção.
3. Discuta e ajuste **antes** de escrever código.
4. Implemente. Cada critério de aceite vira um teste em `packages/core`,
   `apps/web/src/**/*.test.ts(x)` ou `apps/web/e2e/`.
5. Marque a spec como `implementada` e aponte onde os testes moram.

Specs não são reescritas depois de implementadas. Se a decisão mudar, escreva
uma nova que substitua a anterior e registre isso nas duas — o histórico de
por que o sistema é como é vale mais que um documento sempre atualizado.

## O que merece uma spec

Merece: regra de negócio nova, mudança no modelo de conteúdo, uma fatia do
admin, qualquer coisa que altere o que o site publica.

Não merece: ajuste de espaçamento, troca de cor, renomear um componente,
corrigir um erro de digitação. Se não muda comportamento observável, vá direto
ao código.

## Estado atual

| Spec | Assunto | Estado |
| --- | --- | --- |
| [0001](0001-catalogo-no-banco.md) | Catálogo no Postgres com publicação estática | implementada |
| [0002](0002-painel-de-produtos.md) | Painel de administração: produtos | implementada |
| [0003](0003-edicao-de-receitas.md) | Painel de administração: receitas | proposta |
