---
name: tela-do-admin
description: Convenções do painel em /admin — tela nova, formulário, tabela, diálogo, procedimento tRPC protegido. Use ao mexer em apps/web/src/routes/admin.*, components/admin ou packages/api/src/routers.
---

# Telas do painel

O painel vive na mesma aplicação e na mesma origem do site. Não há servidor
separado, e `authClient` não leva `baseURL` por causa disso.

## Nomes

Aqui o vocabulário é **português**, ao contrário do site público: `salvar`,
`aoFechar`, `enviando`, `dialogo`, `revalidar`. O painel é ferramenta interna e
o time que o mantém fala português; misturar os dois idiomas na mesma tela
custa mais que a consistência com `components/`.

Primitivos shadcn ficam em `packages/ui/src/components/` e entram pelo CLI. Não
corrija esses arquivos à mão — a próxima geração desfaz. Eles são formatados,
mas não lintados, por isso mesmo.

## Estrutura

- Rota nova: `apps/web/src/routes/admin.<assunto>.tsx`, entrando sozinha no
  `NAV` de `components/admin/nav.ts` — a barra lateral, a gaveta do celular e
  a trilha da barra superior saem dessa lista.
- Toda tela abre com `<PageHeading>` e usa `<RouteLoader />` enquanto carrega.
- Filtro e busca de listagem vão na URL, com `validateSearch` — link para uma
  família específica precisa funcionar colado no navegador.

## Celular primeiro

O painel é usado no celular. Listagem é `<ItemList>` + `<ItemRow>`
(`components/admin/item-list.tsx`): uma marcação só, grade no desktop e cartão
no celular. Não use `<Table>` — ela rola de lado e esconde as ações.

Os primitivos shadcn são ajustados para o painel em `apps/web/src/index.css`,
sob `[data-painel]`: alvo de toque de 44 px, cores da marca. Não repita
`className` de tamanho em cada botão ou campo.

Remoção pede confirmação com `<ConfirmDialog>`, nunca `confirm()`. Lista vazia
é `<EmptyState>`, com texto diferente para "nada cadastrado" e "nada
encontrado".

## Tela de conteúdo

Configurações, Início, Sobre e as políticas editam um **documento inteiro**
cada. As peças estão em `components/admin/form-kit.tsx`:

- `useDocumentForm(inicial)` guarda o rascunho, diz se há alteração e avisa
  antes de sair da página com trabalho pendente.
- `<FormSection>` é um cartão por seção do site, na ordem em que aparece, com
  a etiqueta de onde aquilo é exibido.
- `<TextField>`, `<EditableList>` (subir, descer, remover, adicionar) e
  `<SaveBar>`, presa ao pé da tela.

Depois de salvar, `form.aceitar(salvo)` — o servidor devolve o documento já
aparado pelo domínio, e é ele que a tela passa a mostrar.

## Slug não se pergunta

Quem cadastra pensa no nome. Produto e família nascem com o slug derivado por
`paraSlug` no caso de uso; a receita mostra o endereço sugerido e deixa
trocar, porque ele é a URL pública.

## Regra não se repete na tela

O formulário **não** valida nome, formato de slug ou existência de família. Quem decide é `packages/core`; `packages/api/src/errors.ts` traduz
o erro; a tela mostra a mensagem que chegou. Validação duplicada no formulário
vira uma segunda verdade que ninguém lembra de atualizar.

Use `required` e `type` do HTML para forma de campo. Regra de negócio, não.

## Foto

Campo de foto é `<PhotoField>` (`components/admin/photo-field.tsx`), com o
valor `{ atual, nova }` no estado do formulário. Ele só escolhe o arquivo: quem
salva chama `resolverFoto` antes da mutação e passa
`{ onError: () => descartarFoto(foto.enviada) }` nela — a foto sobe primeiro, e
sai do bucket se a gravação falhar. Veja `admin.produtos.tsx`.

O campo se desliga sozinho quando o bucket não está configurado. Miniatura em
listagem usa `urlDaImagem(item.image, base)`, com a base de
`trpc.imagens.estado`.

## Consultas e escrita

Leitura com `useQuery(trpc.<router>.<proc>.queryOptions())`. Depois de
qualquer escrita, `queryClient.invalidateQueries()` — as contagens da visão
geral dependem das mesmas linhas.

Confira `isPending` e `isError` **em cada consulta separadamente**. O
TypeScript só estreita a união do React Query quando o teste é feito no próprio
objeto; um `const erro = a.error ?? b.error` deixa `data` possivelmente
indefinido.

Sucesso vira `toast.success`; falha de escrita destrutiva vira `toast.error`;
falha de formulário aparece dentro do diálogo, perto do campo.

## Procedimento novo

Em `packages/api/src/routers/`: `protectedProcedure` por padrão,
`publicProcedure` só para leitura que a publicação precisa sem sessão. Sempre
envolvido em `traduzindoErros`, sempre delegando a um caso de uso.

## Antes de dar por pronto

Rota nova do painel entra em `ROTAS_PROTEGIDAS` no `apps/web/e2e/admin.spec.ts`.
Essa suíte roda **sem `DATABASE_URL`**: a rota tem que responder 200 com a tela
de acesso. Se responder 500, a casca do painel arrastou o banco para o bundle do
site.

Tela que **carrega ou grava** dado ganha também um teste em
`apps/web/e2e/com-banco/`, que roda contra Postgres de verdade com a sessão já
aberta. A expectativa vem de `src/data/`, a mesma origem do `catalog:seed` —
não escreva contagens à mão, que o catálogo cresce.

Se um locator do teste ficar ambíguo, o costume aqui é consertar a marcação, não
o seletor: um número solto ao lado de um rótulo é ambíguo para o Playwright pelo
mesmo motivo que é para quem usa leitor de tela.
