# 0003 — Painel de administração: receitas

- **Estado:** proposta
- **Data:** 2026-09-02

## Problema

A [0002](0002-painel-de-produtos.md) entregou produtos; receitas ficaram só de
leitura. O domínio e a API já sabem criar, atualizar e remover — falta a tela.

Receita não é produto: tem duas listas ordenadas (ingredientes e modo de
preparo) e um vínculo com os produtos citados. Um formulário de campos simples
não dá conta.

## Decisão

*A escrever antes de implementar.* Pontos a resolver na discussão:

- Como editar listas ordenadas sem transformar a tela em um editor de texto —
  uma linha por item, com reordenar e remover.
- Como escolher os produtos citados entre 105 opções: busca por nome, não uma
  lista solta.
- O que acontece ao remover um produto citado por uma receita. Hoje o banco
  bloqueia (`onDelete: "restrict"`); a tela precisa dizer isso em português, e
  não devolver o erro do Postgres.
- Se a receita ganha rascunho, ou se toda gravação já é conteúdo publicável.
  A publicação é um comando separado, então talvez rascunho seja complexidade
  sem retorno.

## Critérios de aceite

*A escrever com a decisão.* O mínimo já conhecido:

- [ ] Dada uma receita com 12 ingredientes, quando um do meio é removido,
      então a ordem dos demais é preservada.
- [ ] Dada uma receita citando um produto, quando esse produto é removido,
      então a tela explica o bloqueio nomeando a receita.
- [ ] Dada uma receita salva, quando a publicação roda, então o `time` exibido
      e o `PT#H#M` do JSON-LD derivam do mesmo `minutes`.

## Fora do escopo

Upload de foto da receita. Importar receita de fonte externa.

## Onde isso vive

A escrever na implementação.
