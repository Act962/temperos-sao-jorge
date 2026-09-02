# São Jorge Alimentos

Site institucional de uma marca de temperos, chás e ervas, com painel de
administração do catálogo.

Leia o `README.md` antes de mexer: ele explica a arquitetura, o fluxo do
conteúdo e como rodar. Aqui ficam só os pontos que se perdem com facilidade.

## O invariante que não se quebra

**O site público sobe sem Postgres.** Nenhuma rota que não seja `/admin` ou
`/api` pode importar `packages/db` ou `packages/auth`, nem de forma indireta.
O e2e roda sem `DATABASE_URL` justamente para quebrar inteiro quando isso
acontecer.

O conteúdo vai do banco para o site por um comando de publicação, não em
runtime. `apps/web/src/data/{products,recipes}.ts` são gerados: têm aviso no
topo e não se editam à mão.

## Antes de escrever código

Mudança de comportamento começa por uma spec em `specs/`. Veja a skill
`spec-primeiro`. Ajuste visual e refatoração sem mudança de comportamento vão
direto ao código.

## Skills deste repositório

| Skill | Quando |
| --- | --- |
| `spec-primeiro` | Começar qualquer mudança de comportamento |
| `regra-de-negocio` | Domínio, casos de uso, portas, adaptadores, erros |
| `componente-do-site` | Componentes, páginas, SEO e imagens do site público |
| `tela-do-admin` | Telas do painel e procedimentos tRPC |

## Portão de qualidade

```bash
pnpm run ci
```

Roda Biome, tipos, unitários e build. O e2e é `pnpm run test:e2e` e precisa do
build de produção. Não há `dev` com HMR — veja o porquê no `README.md`.

## Idiomas

Site público: nomes de componente e de arquivo em inglês, conteúdo visível em
português. Painel e domínio: vocabulário em português (`salvar`, `aoFechar`,
`criarProduto`). Comentários e commits em português.
