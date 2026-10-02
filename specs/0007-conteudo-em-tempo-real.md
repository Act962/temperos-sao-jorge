# 0007 — Edição no ar ao salvar, sem publicação

- **Estado:** implementada
- **Data:** 2026-10-01
- **Substitui em parte:** [0001](0001-catalogo-no-banco.md) — a publicação
  deixa de ser o caminho do conteúdo até o site e passa a ser a reserva.

## Problema

A 0001 pôs o catálogo no Postgres e manteve o site estático: o que o painel
grava só aparece depois de `pnpm run catalog:publish` e de um novo deploy. Na
prática isso significa que quem cuida da marca troca o nome de um produto,
abre o site, não vê a mudança e conclui que o painel não funcionou. O passo
que falta é um comando de terminal e um deploy, que essa pessoa não faz.

Em outro site da casa (Ipê Ambiente) o painel grava e a mudança está no ar na
próxima visita, e é esse o comportamento esperado aqui.

## Decisão

O site público passa a ler o conteúdo do banco em tempo de execução. Salvar no
painel é publicar.

O que **não** muda é a garantia que a 0001 queria proteger: **o site sobe e
responde sem Postgres**. Ela só troca de forma.

- **Leitura por função de servidor.** As rotas públicas buscam o catálogo no
  `loader`, por uma função de servidor que importa `packages/db`
  **dinamicamente**. Nenhuma rota pública importa o banco de forma estática —
  a regra de hoje continua valendo para o grafo de imports, e a suíte e2e sem
  banco continua sendo quem a trava.
- **Reserva.** Sem `DATABASE_URL`, ou com o banco fora do ar, a função devolve
  o conteúdo de `apps/web/src/data/{products,recipes}.ts`. O site continua
  respondendo 200 com o último conteúdo publicado nesses arquivos, e registra
  a falha no log do servidor. No Ipê a reserva é o conteúdo de fábrica e a
  queda é silenciosa; aqui é o último retrato publicado e a queda é
  registrada.
- **`catalog:publish` continua existindo**, com outro papel: atualizar o
  retrato de reserva. Deixa de ser necessário para a edição ir ao ar.
- **Cache invalidado ao salvar, não por relógio.** O catálogo lido fica no
  Runtime Cache da Vercel (`getCache` de `@vercel/functions`), marcado com a
  etiqueta `catalogo`. Esse cache é comum a todas as instâncias da função.
  Toda escrita bem-sucedida do painel expira a etiqueta, e a Vercel propaga a
  expiração para todas as regiões em até 300 ms. Enquanto ninguém edita, o
  site não consulta o banco; quando alguém edita, a visita seguinte já lê o
  conteúdo novo.
  - A entrada tem validade de uma hora só como rede de proteção, para o caso
    de uma expiração se perder. No uso normal ela nunca vence sozinha.
  - Fora da Vercel — máquina local, e2e — `getCache` cai sozinho num cache em
    memória do processo, com a mesma interface. O código é um só.
  - A expiração acontece na rota `/api/trpc`, depois de qualquer `POST` que
    deu certo, e não em cada procedimento: uma mutação nova não tem como
    esquecer de invalidar.
- **Leitura validada pelo domínio.** O que sai do banco passa pelos mesmos
  casos de uso de `packages/core` que o painel usa.

Alternativas descartadas:

- **Botão "Publicar" disparando um deploy.** Mantém o site 100% estático, mas
  a mudança leva minutos, depende de Deploy Hook e de `DATABASE_URL` no build,
  e mantém o modelo mental de dois passos que é justamente a queixa.
- **Ler o banco direto nos componentes ou em rotas que importam `packages/db`.**
  Derruba o site inteiro quando o banco cai, e a suíte sem banco perde o
  sentido.
- **Sem cache, como no Ipê.** Lá é uma página só e uma chave no Redis. Aqui
  são 105 produtos renderizados no servidor em nove rotas.
- **Cache com prazo curto (um minuto).** Foi a primeira proposta. Consulta o
  banco a cada minuto mesmo sem edição nenhuma, e em memória só dá para
  limpar a instância que recebeu a gravação — as outras esperariam o prazo.

## Critérios de aceite

- [x] Dado um produto renomeado no painel, quando a página da família é
      recarregada, então o nome novo aparece sem comando nem deploy.
- [x] Dada uma receita criada no painel, então ela responde em
      `/receitas/<slug>` e entra no `sitemap.xml`.
- [x] Dado o servidor sem `DATABASE_URL`, então todas as rotas públicas
      respondem 200 com o conteúdo de `src/data/`.
- [x] Dadas duas visitas seguidas sem edição entre elas, então a segunda não
      consulta o banco.
- [x] Dado um `POST` em `/api/trpc` que falhou, então o cache não é expirado.
- [x] Dado o banco inacessível, então as rotas públicas respondem 200 com a
      reserva e a falha aparece no log.
- [x] Dada qualquer rota pública, então ela não importa `packages/db` nem
      `packages/auth` de forma estática.
- [x] Dados os 105 produtos, então eles continuam saindo no HTML do servidor.
- [x] Dada uma família removida, então `/produtos/<familia>` passa a responder
      404.

## Fora do escopo

Rascunho, pré-visualização e histórico de versões — salvar é publicar, por
decisão. Dados da empresa, textos das páginas e usuários ficam para as specs
seguintes, que usam esta mesma leitura. Imagens seguem na
[0005](0005-upload-de-imagens-no-painel.md).

## Onde isso vive

- Catálogo na forma do site: `packages/core/src/use-cases/published-catalog.ts`
- Leitura do banco: `packages/api/src/published-catalog.ts`, `repos.ts`
- Cache, limite de tempo e reserva: `apps/web/src/server/catalog-source.ts`
- Ligação com o Runtime Cache e os arquivos de reserva:
  `apps/web/src/server/catalog.server.ts`
- Função de servidor, consulta e `useCatalog`: `apps/web/src/lib/catalog.ts`
- Expiração ao gravar: `apps/web/src/routes/api.trpc.$.ts`
- Testes:
  - `packages/core/src/use-cases/use-cases.test.ts` — forma do catálogo e
    edição refletida na leitura seguinte
  - `apps/web/src/server/catalog-source.test.ts` — sem banco, segunda visita
    pelo cache, banco fora do ar ou lento, pausa após falha, cache quebrado,
    e quando a rota expira
  - `apps/web/e2e/site-publico.spec.ts` — rotas públicas 200 sem
    `DATABASE_URL`, e os 105 produtos no HTML do servidor
  - `apps/web/e2e/com-banco/admin-dados.spec.ts` — produto renomeado aparece
    no site, receita criada responde e entra no sitemap, família removida
    vira 404

## O que falta conferir em produção

O Runtime Cache só existe na Vercel, e o projeto empacota com um script
próprio (`scripts/build-vercel.mjs`) em vez do alvo oficial do framework.
Localmente o código roda com o cache em memória que o `getCache` oferece como
substituto. No primeiro deploy: editar um produto e conferir, no log da
função, que a visita seguinte lê do banco e a segunda não.
