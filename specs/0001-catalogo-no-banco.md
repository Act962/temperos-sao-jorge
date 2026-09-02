# 0001 — Catálogo no Postgres com publicação estática

- **Estado:** implementada
- **Data:** 2026-09-02

## Problema

O catálogo — 105 produtos, 8 famílias e 6 receitas — vivia em arquivos
TypeScript editados à mão. Toda correção de nome ou troca de foto exigia
alguém com o repositório clonado, e a equipe da marca não tem isso.

## Decisão

O conteúdo passa a morar no Postgres, mas **o site público continua sem ler
banco nenhum**. A ponte é um comando de publicação que regrava
`apps/web/src/data/{products,recipes}.ts` a partir do banco; o build consome
esses arquivos como sempre consumiu.

Alternativas descartadas:

- **Site lendo o banco em runtime.** Colocaria o Postgres no caminho de cada
  visita: uma queda do banco derrubaria a home. O conteúdo muda algumas vezes
  por mês; pagar disponibilidade de banco por isso não se justifica.
- **CMS hospedado.** Custo mensal e mais um lugar para a senha vazar, para um
  catálogo que cabe em três tabelas.

O `time` das receitas ("1 h 20 min") deixa de ser campo e passa a ser derivado
de `minutes` na publicação. Eram dois campos independentes, e bastava um ficar
para trás para a receita exibir um tempo e cair no filtro de duração do outro.

## Critérios de aceite

- [x] Dado o site em produção sem `DATABASE_URL`, quando qualquer página
      pública é acessada, então responde 200.
- [x] Dado o mesmo cenário, quando `/api/trpc/*` é acessado, então falha — a
      API precisa de banco, o site não.
- [x] Dado o catálogo carregado no banco, quando a publicação roda duas vezes
      seguidas, então o segundo diff é vazio.
- [x] Dado um produto cujo packshot aponta para a pasta de outra família,
      quando ele é salvo, então a gravação é recusada com a família no erro.
- [x] Dada uma receita de 80 minutos, quando publicada, então exibe
      "1 h 20 min" e o JSON-LD traz `PT1H20M`.

## Fora do escopo

Upload de imagem pelo painel — o packshot continua entrando pelo pipeline de
`scripts/optimize-product-images.mjs`. Versionamento ou agendamento de
publicação.

## Onde isso vive

- Domínio e regras: `packages/core/src/domain/`
- Portas: `packages/core/src/ports/catalog-repository.ts`
- Adaptadores Drizzle: `packages/db/src/repositories/catalog.ts`
- Carga e publicação: `packages/db/scripts/{seed,publish}-catalog.mjs`
- Testes: `packages/core/src/**/*.test.ts`,
  `packages/db/src/**/*.integration.test.ts`, `apps/web/e2e/site-publico.spec.ts`
