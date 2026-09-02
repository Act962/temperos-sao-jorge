# 0003 — Painel de administração: receitas

- **Estado:** implementada
- **Data:** 2026-09-02

## Problema

A [0002](0002-painel-de-produtos.md) entregou produtos; receitas ficaram só de
leitura. O domínio e a API já sabem criar, atualizar e remover — falta a tela.

Receita não é produto: tem duas listas ordenadas (ingredientes e modo de
preparo) e um vínculo com os produtos citados. Um formulário de campos simples
não dá conta.

Há também um buraco herdado da 0001. O banco impede apagar um produto citado
por alguma receita (`onDelete: "restrict"` em `recipe_product.product_slug`),
mas nada no domínio confere isso antes: hoje a remoção estoura como erro do
Postgres e chega ao painel como 500 sem mensagem.

## Decisão

### Editar em página própria, não em diálogo

Uma receita tem doze ingredientes, oito passos e uma busca de produtos. Isso não
cabe num diálogo sem virar uma caixa que rola dentro de outra. As rotas ficam
`/admin/receitas/nova` e `/admin/receitas/<slug>`, o que também dá endereço
próprio para retomar uma edição.

Produtos continuam em diálogo: quatro campos cabem ali, e a fatia não precisa
ser refeita para ficar parecida.

### Listas ordenadas: uma linha por item, com subir e descer

Um campo por item, com botões de subir, descer e remover, mais "adicionar".
Nada de arrastar e soltar: exigiria uma biblioteca e precisão de ponteiro, e
some para quem usa teclado ou leitor de tela. Subir e descer resolvem a
reordenação de uma lista de dez itens sem nada disso.

Descartado também o campo de texto com um item por linha. É rápido de escrever
e péssimo de revisar: um `Enter` a mais divide um ingrediente em dois sem
ninguém perceber.

### Produtos citados: busca por nome, não lista solta

São 105 produtos. Um `<select multiple>` com 105 opções é inutilizável. O autor
digita parte do nome, escolhe entre os que casam, e os escolhidos aparecem como
fichas removíveis.

### Remover produto citado é recusado pelo domínio

A regra sai do banco e vira caso de uso: `removerProduto` consulta as receitas
que citam o produto e, havendo alguma, recusa com `ConflictError` nomeando-as.
O painel mostra a frase pronta — "Camarão na Moranga cita este produto" — em vez
do erro de chave estrangeira.

Deixar a decisão no `restrict` do Postgres tinha duas falhas: a mensagem é
ilegível, e a regra sumiria dos testes em memória, que rodam sem banco.

### Sem rascunho

Toda gravação já é conteúdo publicável. A publicação continua sendo um comando
separado, então o banco **já é** o rascunho: nada chega ao site até
`catalog:publish` rodar. Um sinalizador de rascunho criaria dois estados de
"ainda não publicado" para explicar, sem nada em troca.

## Critérios de aceite

- [x] Dada uma receita com vários ingredientes, quando um do meio é removido,
      então a ordem dos demais é preservada.
- [x] Dado um item de lista movido para cima e a receita salva, então a nova
      ordem sobrevive à publicação.
- [x] Dada uma receita citando um produto, quando esse produto é removido,
      então a operação é recusada nomeando as receitas que o citam.
- [x] Dado o mesmo cenário sem `DATABASE_URL`, quando o caso de uso roda contra
      o repositório em memória, então a recusa é a mesma — a regra não depende
      do banco.
- [x] Dado o campo de busca de produtos, quando o autor digita parte de um
      nome, então só os produtos correspondentes aparecem para adicionar.
- [x] Dada uma receita sem nenhum passo de preparo, quando salva, então é
      recusada com a mensagem do domínio.
- [x] Dada a edição aberta em `/admin/receitas/<slug>`, quando a página é
      recarregada, então o formulário volta com os dados daquela receita.
- [x] Dada uma receita de 80 minutos, quando publicada, então o `time` exibido
      e o `PT1H20M` do JSON-LD derivam do mesmo `minutes`.

## Fora do escopo

Upload de foto da receita — o campo continua sendo o caminho do arquivo.
Importar receita de fonte externa. Reordenar por arrastar. Histórico de
alterações.

## Onde isso vive

- Rotas: `apps/web/src/routes/admin.receitas.{index,nova,$slug}.tsx`
- Formulário e campos: `apps/web/src/components/admin/{recipe-form,
  ordered-list-field,product-picker}.tsx`
- Recusa de remoção: `removerProduto` em
  `packages/core/src/use-cases/products.ts`, apoiada em `listByProduct` na
  porta `RecipeRepository`
- Testes:
  - listas ordenadas e busca de produtos —
    `apps/web/src/components/admin/recipe-fields.test.tsx`
  - recusa nomeando as receitas, em memória —
    `packages/core/src/use-cases/use-cases.test.ts`
  - a mesma recusa chegando antes do `restrict` do Postgres, e a ordem
    sobrevivendo à gravação —
    `packages/db/src/repositories/catalog.integration.test.ts`
  - receita sem ingredientes ou passos — `packages/core/src/domain/domain.test.ts`
  - duração derivada de `minutes` — `packages/core/src/domain/domain.test.ts`
  - rotas do painel respondendo sem banco — `apps/web/e2e/admin.spec.ts`
