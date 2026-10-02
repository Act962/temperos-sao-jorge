# São Jorge Alimentos

Site institucional de uma marca de temperos, chás e ervas, com painel de
administração do catálogo.

Leia o `README.md` antes de mexer: ele explica a arquitetura, o fluxo do
conteúdo e como rodar. Aqui ficam só os pontos que se perdem com facilidade.

## O invariante que não se quebra

**O site público sobe e responde sem Postgres.** Nenhuma rota que não seja
`/admin` ou `/api` pode importar `packages/db`, `packages/auth` ou
`packages/api` de forma **estática**, nem indiretamente. O e2e roda sem
`DATABASE_URL` justamente para quebrar inteiro quando isso acontecer.

Salvar no painel é publicar (spec 0007): o site lê o catálogo do banco a cada
visita. As rotas públicas pedem o catálogo por `apps/web/src/lib/catalog.ts`
— `catalogQuery` no `loader`, `useCatalog()` no componente — e nunca importam
os dados de `apps/web/src/data/{products,recipes}.ts`. Só o tipo (`import
type`) pode vir de lá.

Esses dois arquivos são a **reserva**: o que o site serve sem `DATABASE_URL`
ou com o banco fora do ar. São gerados por `pnpm run catalog:publish`, têm
aviso no topo e não se editam à mão.

Contato, WhatsApp, redes sociais e os textos das páginas também vêm do banco
(spec 0008): são documentos de conteúdo, com o padrão em
`packages/core/src/domain/site-content-defaults.ts`, e o componente os lê com
`useSiteContent()`. Texto novo que a marca deva poder trocar entra num
documento, não no JSX.

O catálogo lido fica em cache e é expirado em toda gravação do painel, na rota
`/api/trpc`. Mutação nova não precisa fazer nada; escrita no banco por outro
caminho precisa chamar `expireCatalog()`.

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
