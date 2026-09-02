# São Jorge Alimentos

Site institucional e catálogo da São Jorge Alimentos, implementado a partir do
projeto do Claude Design `Sao Jorge Alimentos.dc.html`.

Monorepo criado com [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack):
TanStack Start (SSR) + tRPC + Drizzle + PostgreSQL + Better-Auth, com Biome e
Vite+.

O backend Hono separado foi absorvido pelo TanStack Start: `/api/auth/*` e
`/api/trpc/*` são server routes do próprio app, na mesma origem do site. Um
artefato de deploy, sem CORS.

## Páginas

| Rota | Conteúdo |
| --- | --- |
| `/` | Home: hero, história, famílias de produtos, receitas, selos da marca |
| `/produtos` | Catálogo completo (105 produtos) |
| `/produtos/:familia` | Uma página por família — 8 URLs indexáveis |
| `/receitas` | Índice de receitas com filtros |
| `/receitas/:slug` | Receita com ingredientes, modo de preparo e produtos usados |
| `/sobre` | História da empresa e linha do tempo |
| `/contato` | Formulário e dados de atendimento |
| `/privacidade`, `/cookies` | Documentos legais |
| `/sitemap.xml`, `/robots.txt` | Gerados a partir de `src/lib/site-routes.ts` |

## SEO

- Title, description, canonical, Open Graph e Twitter Card por rota, montados
  em `src/lib/seo.ts` — as rotas descrevem *o que* é a página, nunca as tags.
- O documento raiz emite apenas tags globais. Tags `link` **não** são
  deduplicadas por `rel`, então um canonical na raiz sairia junto com o de cada
  página e deixaria dois canonicals conflitantes no `<head>`.
- JSON-LD em `src/lib/structured-data.ts`: `Organization` e `WebSite` em todas as
  páginas, `BreadcrumbList` nas internas, `ItemList` nas listagens e `Recipe`
  nas receitas.
- `LocalBusiness` só é publicado quando `CONTACT.hasVerifiedAddress` for `true`
  em `src/data/site.ts` — não publicamos endereço de exemplo como dado
  estruturado.
- `lang="pt-BR"`, um `<h1>` por página, skip link e conteúdo renderizado no
  servidor (os 105 produtos saem no HTML, sem depender de JavaScript).

## Arquitetura

O domínio vive em `packages/core` e não conhece banco, HTTP nem React:

```
packages/core/src/
├── domain/      # entidades e regras: Slug, Product, Recipe
├── ports/       # interfaces que o domínio precisa (repositórios)
├── use-cases/   # orquestração, recebendo as portas por parâmetro
└── testing/     # adaptadores em memória, para exercitar sem Postgres
```

`packages/db/src/repositories/` implementa as mesmas portas com Drizzle. É a
única camada que sabe que existe Postgres — por isso os casos de uso rodam
idênticos contra memória (35 testes, milissegundos) e contra o banco real
(11 testes de integração).

### Fluxo do conteúdo

O admin grava no Postgres; o site público não lê banco nenhum. A ponte é um
comando de publicação:

```bash
pnpm run catalog:publish
```

Ele lê o banco e regrava `apps/web/src/data/{products,recipes}.ts`, que é o que
o build consome. Depois, `pnpm --filter web build` gera o site com o conteúdo
novo. Os arquivos gerados trazem um aviso no topo e não devem ser editados à
mão.

Carga inicial, dos arquivos TS para o banco (uma vez só):

```bash
pnpm run catalog:seed
```

O `time` das receitas ("1 h 20 min") é derivado de `minutes` na publicação. Eram
dois campos independentes, e bastava um ficar para trás para a receita exibir um
tempo e cair no filtro de duração do outro.

## Painel de administração

Em `/admin`, na mesma aplicação e na mesma origem do site — não há servidor
separado. É onde o catálogo é editado antes de publicar.

| Rota               | O que faz                                              |
| ------------------ | ------------------------------------------------------ |
| `/admin`           | Visão geral: contagens e produtos por família           |
| `/admin/produtos`  | Criar, editar e remover produtos                        |
| `/admin/receitas`  | Lista das receitas (edição na próxima fatia)            |

O acesso é por e-mail e senha (Better-Auth). Sem sessão, o formulário de acesso
ocupa o lugar do conteúdo em vez de redirecionar: entrar em `/admin/produtos`
leva de volta a `/admin/produtos` depois do login. As rotas do painel saem do
`noindex, nofollow` e não carregam o cabeçalho nem o rodapé do site.

Primeiro usuário, com o servidor de pé:

```bash
curl -X POST http://localhost:3000/api/auth/sign-up/email -H "Content-Type: application/json" -d '{"email":"voce@alimentossaojorge.com","password":"trocar-esta-senha","name":"Seu Nome"}'
```

As regras não moram na tela. O formulário de produto não confere o caminho do
packshot nem o formato do slug — quem decide é o domínio em `packages/core`, e a
mensagem dele aparece no lugar do erro. Mudar um chá para a família de ervas sem
mover a foto responde, na própria tela, *"O packshot de 'Melissa' está na pasta
de outra família"*. Duplicar a regra no formulário criaria uma segunda verdade
para manter em sincronia.

## Organização do código

Componentes têm nomes e arquivos em inglês, um componente por arquivo; o
conteúdo visível é em português.

```
apps/web/src/
├── components/
│   ├── layout/     # header, mega menu, footer, newsletter, redes sociais
│   ├── home/       # seções da home
│   ├── products/   # card, grade, filtro e catálogo
│   ├── recipes/    # card e grade
│   ├── about/      # linha do tempo e galeria de arquivo
│   ├── contact/    # formulário e dados de contato
│   ├── legal/      # shell dos documentos legais
│   ├── admin/      # casca do painel, acesso e formulários
│   └── ui/         # primitivos da marca (botão, heading, reveal, imagens…)
├── data/           # catálogo, receitas, linha do tempo, textos legais, config
├── hooks/          # use-image-fallback
├── lib/            # seo, structured-data, site-routes
└── routes/         # rotas de arquivo do TanStack Router
```

Os tokens da marca (cores, tipografia, containers) ficam em
`apps/web/src/index.css`, sob `@theme`, e são usados como utilitários Tailwind
(`bg-brand`, `text-ink-muted`, `font-display`, `shell`…).

## Variáveis de ambiente

`VITE_SITE_URL` é a origem pública do site e alimenta canonical, Open Graph,
`sitemap.xml` e `robots.txt`. Variáveis `VITE_` são embutidas em tempo de build,
por isso o domínio está definido em três camadas — nesta ordem de precedência:

| Arquivo | Quando vale | Valor |
| --- | --- | --- |
| `apps/web/.env.production` | `vite build` (modo production) | `https://alimentossaojorge.com` |
| `apps/web/.env` | `vite dev` | `http://localhost:3001` |
| `packages/env/src/web.ts` | fallback, se nenhum arquivo existir | `https://alimentossaojorge.com` |

Os arquivos `.env*` são ignorados pelo git (veja `apps/web/.env.example`), então
o default versionado em `web.ts` é o que garante um build correto em CI ou em
uma máquina limpa. O canonical usa o apex `alimentossaojorge.com` — configure o
servidor para redirecionar `www` para o apex, e não o contrário.

## Imagens

A hero e os 105 packshots de produto já estão em `apps/web/public/images/`.
Os packshots foram convertidos dos originais (PNGs de ~5000×5000, 745 MB no
total) para WebP de 600 px de altura, recortados na moldura transparente —
4,4 MB no total:

```bash
pnpm run images:products "C:/caminho/para/FAMILIAS"
```

O logo também está no lugar: o master fica em `apps/web/assets-src/` (fora de
`public/`, para não ir no deploy) e a versão servida tem 640 px e 47 KB. Os
favicons saem do mesmo master:

```bash
pnpm run images:favicons
```

Faltam apenas as fotos editoriais e de receitas. A lista completa, com formatos
sugeridos, está em [`apps/web/ASSETS.md`](apps/web/ASSETS.md); enquanto não
existirem, cada slot renderiza um placeholder da marca.

## Como rodar

```bash
pnpm install
```

Subir o site (constrói e serve na porta 3001):

```bash
pnpm --filter web start
```

É o mesmo comando que a configuração do Browser pane usa (`.claude/launch.json`).
Para separar as etapas, `pnpm --filter web build` e `pnpm --filter web serve`.

### Por que não há `dev` com HMR

`pnpm --filter web dev` (`vp dev`) **não serve o site**: responde `Cannot GET /`
em toda rota HTML, embora `/@vite/client`, os módulos de `src/` e os estáticos
respondam 200.

A causa está no plugin do TanStack Start. Ele registra o middleware SSR na
função que o hook `configureServer` **retorna** — o hook "post", que o Vite
executa depois de instalar os middlewares internos:

```js
// @tanstack/start-plugin-core/dist/esm/vite/dev-server-plugin/plugin.js
configureServer(viteDevServer) {
  return () => {
    // ...
    viteDevServer.middlewares.use(async (req, res) => { /* SSR */ })
  }
}
```

O vite-plus 0.3.0 não chama essa função de retorno, então o middleware nunca
entra e nada responde HTML. Confirmado forçando `installDevServerMiddleware:
true` no plugin: nessa configuração ele deveria **lançar** um erro se o
ambiente fosse incompatível — não lançou e não montou, o que prova que o hook
post não roda. Não há correção possível por configuração; depende de uma
atualização do vite-plus ou de trocar para o Vite oficial (hoje substituído
pelo `overrides` no `package.json` da raiz).

O build de produção não usa esse caminho, então não é afetado.

### Banco de dados

O site público **não usa banco**: o conteúdo é publicado estaticamente e as
páginas sobem sem `DATABASE_URL`. Isso é garantido por design — `packages/db` e
`packages/auth` criam suas instâncias sob demanda, e as rotas de API importam
esses módulos dinamicamente, para que o env do servidor não seja validado no
boot do site.

O Postgres é necessário só para autenticação e, adiante, para o admin:

```bash
pnpm run db:push
```

Sem ele, `/` e as demais páginas respondem 200 normalmente; apenas
`/api/auth/*` e `/api/trpc/*` falham.

## Como as mudanças começam

Mudança de comportamento — regra de negócio, modelo de conteúdo, fatia do
painel, o que o site publica — começa por uma especificação em `specs/`, com
problema, decisão, alternativas descartadas e critérios de aceite verificáveis.
Cada critério vira um teste na implementação.

Ajuste de espaçamento, cor, nome de componente ou refatoração sem mudança de
comportamento vai direto ao código. Spec para isso é cerimônia, e cerimônia faz
as pessoas pararem de ler as specs que importam.

Os padrões do repositório estão escritos como skills em `.claude/skills/`:
`spec-primeiro`, `regra-de-negocio`, `componente-do-site` e `tela-do-admin`.
São o resumo do que este README explica por extenso, no ponto em que a decisão
é tomada.

## Qualidade

Tudo o que o CI executa, em um comando:

```bash
pnpm run ci
```

Separadamente:

```bash
pnpm run check
```

```bash
pnpm run test
```

```bash
pnpm run test:e2e
```

### Testes

| Camada | Ferramenta | Onde |
| --- | --- | --- |
| Domínio e casos de uso | Vitest | `packages/core/src/**/*.test.ts` |
| Adaptadores Drizzle | Vitest + Postgres | `packages/db/src/**/*.integration.test.ts` |
| Site | Vitest | `apps/web/src/**/*.test.ts(x)` |
| End-to-end | Playwright | `apps/web/e2e/**/*.spec.ts` |

Os testes de dados e de `lib/` rodam em ambiente Node; só os de componente
pedem jsdom, com `// @vitest-environment jsdom` no topo do arquivo. Isso mantém
a suíte unitária em poucos segundos.

Os testes de integração do Drizzle se pulam sozinhos quando não há
`DATABASE_URL`, então nem o CI nem quem só mexe no site precisa de Postgres.
Para rodá-los:

```bash
pnpm run db:start
```

O e2e roda contra o **build de produção** e **sem `DATABASE_URL`**. Não é
descuido: o site público não usa banco, e a suíte existe para travar essa
propriedade. Se alguém reintroduzir um import estático de `packages/auth` ou
`packages/db` numa rota do site, o e2e quebra inteiro.

As rotas do painel entram na mesma suíte, e pelo mesmo motivo: sem banco elas
ainda respondem 200 com a tela de acesso. Uma delas devolvendo 500 é o sinal de
que a casca do admin arrastou o banco para o bundle do site.

### CI

`.github/workflows/ci.yml` roda em push para `main` e em pull request, em dois
jobs: verificação (`biome ci`, tipos, unitários, build) e, se passar, o
end-to-end com o relatório do Playwright anexado como artefato.

Os primitivos shadcn em `packages/ui/src/components/` são formatados mas não
lintados: o CLI do shadcn reescreve esses arquivos, então correção manual se
perde na próxima geração.

## Pendências conhecidas

- Fotos editoriais e de receitas — veja `apps/web/ASSETS.md`.
- Dados de contato em `src/data/site.ts` ainda são os do design (telefone,
  endereço, CEP e o número de WhatsApp são exemplos). O botão de WhatsApp some
  sozinho se `CONTACT.whatsapp.number` ficar vazio.
- Formulários de contato e newsletter validam e dão feedback, mas não têm
  backend — procure os `TODO` em `components/contact/contact-form.tsx` e
  `components/layout/newsletter-form.tsx`.
- Cinco das seis receitas têm conteúdo redigido para o site e precisam de
  revisão da marca; só `macarrao-ao-molho-de-tomate-caseiro` veio do design.
