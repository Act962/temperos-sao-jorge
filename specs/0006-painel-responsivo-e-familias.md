# 0006 — Painel responsivo, busca e famílias

- **Estado:** implementada
- **Data:** 2026-10-01

## Problema

O painel das specs [0002](0002-painel-de-produtos.md) e
[0003](0003-edicao-de-receitas.md) funciona, mas foi desenhado para quem o
construiu, sentado diante de um monitor:

- No celular, a barra lateral vira uma faixa no topo com os três links
  espremidos lado a lado, e as tabelas de produtos e receitas rolam na
  horizontal — as ações de editar e remover ficam fora da tela.
- São 105 produtos numa lista sem busca. O único filtro é a família, e ele só
  existe para quem chega pelo link da visão geral.
- Criar um produto exige digitar o slug, que é um identificador interno: quem
  cuida da marca não sabe o que é, nem que precisa ser minúsculo e sem acento.
- Um produto novo nasce na posição 0 e aparece antes de todos os outros.
- Família só se cria por chamada de API. Não há tela para renomear, reordenar
  ou remover, embora a ordem delas defina o menu, o rodapé e a home do site.
- A remoção pede confirmação por `confirm()` do navegador, que no celular
  aparece com o endereço do site no título e não diz o que vai acontecer.

## Decisão

Refazer a casca do painel e as listagens, e abrir a tela de famílias. O
desenho foi aprovado em mock antes do código.

**Casca.** Barra lateral agrupada pelo que a pessoa procura — *Catálogo* hoje,
*Páginas do site* e *Geral* nas próximas fatias — e uma barra superior com a
trilha da tela, o atalho "Ver o site" e a saída. Abaixo de `lg` a lateral vira
gaveta, aberta por um botão na barra superior. `NAV` continua sendo a única
fonte: menu e trilha saem da mesma lista.

**Listagens.** Uma marcação só, que é linha de grade no desktop e cartão no
celular. A alternativa — `<table>` no desktop e lista no celular — duplicaria
cada linha no DOM e daria dois botões "Editar Melissa" para o leitor de tela e
para os testes. A busca e o filtro de família vão na URL (`?busca=`,
`?familia=`) e filtram no navegador: são 105 linhas já carregadas, e uma ida
ao servidor por tecla só acrescentaria espera.

**Slug derivado.** Produto e família nascem com o slug derivado do nome por
`paraSlug`, no caso de uso. A tela não pergunta. Quem precisa de um slug
específico (a carga inicial, os testes) continua podendo informar.

**Posição.** Sem posição informada, produto e família novos entram no fim.

**Famílias.** Criar, renomear, reordenar por subir e descer, e remover.
Remover uma família com produtos é recusado pelo domínio, com a contagem — o
banco já barra pela chave estrangeira, mas com um erro ilegível. O slug da
família não muda depois de criada: é a URL `/produtos/<familia>` e a pasta dos
packshots.

**Confirmação.** Um diálogo do próprio painel, que nomeia o item e o que
acontece com ele.

Alternativas descartadas:

- **Biblioteca de arrastar e soltar para a ordem das famílias.** Mesmo motivo
  da 0003: oito itens, e subir e descer funciona com teclado e no celular.
- **Componente `Sidebar` do shadcn.** Traz cookie de estado, modo recolhido e
  atalho de teclado para um menu de meia dúzia de itens; a gaveta sai do
  `Dialog` que já está no repositório.

## Critérios de aceite

- [x] Dado um celular, quando o painel abre, então a navegação fica numa
      gaveta fechada, e abri-la mostra todas as seções e a saída.
- [x] Dado um celular, quando a lista de produtos abre, então a página não
      rola na horizontal e editar e remover estão visíveis em cada item.
- [x] Dado o termo "cha" na busca de produtos, então só aparecem produtos com
      "cha" no nome, sem diferenciar acento nem maiúscula, e o termo fica na
      URL.
- [x] Dado `?familia=<slug>` colado no navegador, então a lista abre filtrada
      e a família aparece marcada.
- [x] Dado um produto criado só com nome e família, então o slug é derivado do
      nome e o produto entra no fim da lista.
- [x] Dado um nome que deriva um slug já usado, então a criação é recusada com
      a mensagem do domínio.
- [x] Dada uma família com produtos, quando se tenta removê-la, então a recusa
      diz quantos produtos ainda estão nela.
- [x] Dada uma família sem produtos, quando é removida, então some da lista.
- [x] Dada a ordem das famílias trocada, então a nova ordem é a que as
      listagens devolvem.
- [x] Dada uma lista de reordenação que não corresponde às famílias
      existentes, então nada é gravado.
- [x] Dado um clique em remover, então um diálogo do painel nomeia o item
      antes de qualquer gravação.

## Fora do escopo

Edição das páginas do site, configurações e usuários — fatias seguintes. Upload
de imagem continua na [0005](0005-upload-de-imagens-no-painel.md); o campo do
packshot segue sendo o caminho. Como a edição chega ao site é assunto da
[0007](0007-conteudo-em-tempo-real.md).

## Onde isso vive

- Casca: `apps/web/src/components/admin/admin-shell.tsx`, `nav.ts`
- Listagens: `apps/web/src/components/admin/{item-list,search-field,confirm-dialog,empty-state}.tsx`
- Telas: `apps/web/src/routes/admin.{index,produtos,familias,receitas.index}.tsx`
- Regras: `packages/core/src/use-cases/products.ts`
- API: `packages/api/src/routers/catalog.ts`
- Testes: `packages/core/src/use-cases/use-cases.test.ts` (slug derivado,
  posição, famílias), `apps/web/src/components/admin/filtro.test.ts` (busca),
  `apps/web/e2e/admin.spec.ts` (rotas),
  `apps/web/e2e/com-banco/admin-dados.spec.ts` (listas, filtro, famílias,
  confirmação, celular)
