---
name: componente-do-site
description: Convenções do site público — componente novo, seção, página, SEO, imagem ou token da marca. Use ao mexer em apps/web/src/components, routes ou data do site institucional.
---

# Componentes do site público

## Nomes e arquivos

Nome do componente e do arquivo em **inglês**, um componente por arquivo,
`kebab-case.tsx`. O conteúdo visível é em **português**. A pasta diz a seção:
`layout/`, `home/`, `products/`, `recipes/`, `about/`, `contact/`, `legal/`,
`ui/`.

Textos longos, listas e configuração não ficam no componente: vão para
`apps/web/src/data/`.

## Catálogo

Produtos, famílias e receitas vêm do banco a cada visita. No componente,
`useCatalog()` de `lib/catalog.ts`; na rota, `catalogQuery` no `loader`, e o
`head` usa o `loaderData`.

`data/products.ts` e `data/recipes.ts` são a **reserva** que o servidor usa
sem banco. São gerados, trazem aviso no topo e não se editam à mão. De lá o
componente só importa **tipo** (`import type`): um import de valor levaria o
retrato inteiro para o navegador e mostraria dado velho.

## Textos e dados da empresa

Telefone, endereço, WhatsApp, redes sociais e os textos da home, da página
Sobre e das políticas são editados no painel. No componente:
`useSiteContent()` de `lib/site-content.ts`. Em função pura (`structured-data`),
as configurações entram por parâmetro.

Texto novo que a marca deva poder trocar não vai no JSX: entra no tipo do
documento em `packages/core/src/domain/site-content.ts`, no normalizador, no
padrão (`site-content-defaults.ts`) e no formulário da tela correspondente.
Rótulo de botão, título fixo de seção e texto alternativo estrutural continuam
no componente.

`data/site.ts` guarda só o que não se edita: nome, slogan, URL, logo.

Função pura sobre o catálogo recebe o catálogo por parâmetro — veja
`featuredFamilies` em `data/home.ts` e `getSiteRoutes` em `lib/site-routes.ts`.

## Estilo

Tailwind v4 com os tokens da marca declarados em `apps/web/src/index.css` sob
`@theme`: `bg-brand`, `text-ink-muted`, `font-display`, `shell`. Não escreva
hex solto no componente; se falta um tom, o token novo entra no `@theme`.

Não use `class-variance-authority` em `apps/web` — não resolve a partir dali.
Variantes se resolvem com um mapa de classes e `cn()`.

## Imagens

A foto de produto e de receita chega ao componente como endereço pronto, no
catálogo publicado: pode ser um caminho de `public/` (`/images/products/...`)
ou um endereço do bucket. O componente não monta endereço nem sabe a diferença
— use `product.image` e `recipe.image` como vierem. Vazio significa sem foto.

Quem envia foto é o painel (spec 0010). O script
`scripts/optimize-product-images.mjs` continua existindo para o acervo antigo
em `public/images/products/`.

Para fallback de imagem quebrada, use o hook `use-image-fallback`. Ele confere
`node.complete && node.naturalWidth === 0` num ref callback, porque `onError`
não dispara para imagem que já falhou antes da hidratação.

## SEO

Metadados de página saem de `buildPageSeo` em `apps/web/src/lib/seo.ts`.

**Uma canônica por página, e ela vem do `buildPageSeo`.** Tags `link` não são
deduplicadas por `rel`: emitir uma no `__root.tsx` e outra na página produz
duas canônicas conflitantes. `og:site_name` e `og:locale` moram só no
`__root.tsx`, de propósito.

Dados estruturados ficam em `lib/structured-data.ts` — Organization e WebSite
na raiz, BreadcrumbList e ItemList nas listagens, Recipe nas receitas.

## Antes de dar por pronto

O site público **sobe sem banco**. Nenhuma rota em `apps/web/src/routes/` que
não seja `/admin` ou `/api` pode importar `packages/db`, `packages/auth` ou
`packages/api` de forma estática, nem indiretamente — o banco só entra por
`import()` dinâmico, dentro de `server/catalog.server.ts`. O e2e roda sem `DATABASE_URL` justamente para
quebrar inteiro quando isso acontece.
