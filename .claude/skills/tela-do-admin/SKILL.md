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
  `NAV` de `components/admin/admin-shell.tsx`.
- Toda tela abre com `<PageHeading>` e usa `<RouteLoader />` enquanto carrega.
- Filtro de listagem vai na URL, com `validateSearch` — link para uma família
  específica precisa funcionar colado no navegador.

## Regra não se repete na tela

O formulário **não** valida caminho de packshot, formato de slug ou existência
de família. Quem decide é `packages/core`; `packages/api/src/errors.ts` traduz
o erro; a tela mostra a mensagem que chegou. Validação duplicada no formulário
vira uma segunda verdade que ninguém lembra de atualizar.

Use `required` e `type` do HTML para forma de campo. Regra de negócio, não.

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
