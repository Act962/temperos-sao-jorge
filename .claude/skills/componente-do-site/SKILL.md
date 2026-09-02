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
`apps/web/src/data/`. `products.ts` e `recipes.ts` são **gerados** pela
publicação — trazem aviso no topo e não se editam à mão.

## Estilo

Tailwind v4 com os tokens da marca declarados em `apps/web/src/index.css` sob
`@theme`: `bg-brand`, `text-ink-muted`, `font-display`, `shell`. Não escreva
hex solto no componente; se falta um tom, o token novo entra no `@theme`.

Não use `class-variance-authority` em `apps/web` — não resolve a partir dali.
Variantes se resolvem com um mapa de classes e `cn()`.

## Imagens

Packshot entra pelo pipeline `scripts/optimize-product-images.mjs` (recorta a
margem transparente, redimensiona, gera WebP). O caminho segue
`/images/products/<familia>/<arquivo>.webp` — o domínio recusa foto na pasta
de outra família.

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

O site público **não lê banco**. Nenhuma rota em `apps/web/src/routes/` que
não seja `/admin` ou `/api` pode importar `packages/db` ou `packages/auth`,
nem estática nem indiretamente. O e2e roda sem `DATABASE_URL` justamente para
quebrar inteiro quando isso acontece.
