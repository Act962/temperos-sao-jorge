# 0008 — Configurações e textos das páginas no painel

- **Estado:** implementada
- **Data:** 2026-10-01

## Problema

O painel edita o catálogo, mas tudo o mais que o visitante lê está escrito no
código:

- Telefone, e-mail, endereço, horário e WhatsApp em `src/data/site.ts` ainda
  são os valores de exemplo do design — "(11) 3000-0000", "Rua das Indústrias,
  123". Trocar exige alguém com o repositório aberto.
- Os textos da home (abertura, "Nossa história", compromissos da marca) estão
  dentro do JSX de cada componente.
- A história e a linha do tempo da página Sobre, e as duas políticas legais,
  ficam em arquivos de dados.
- O produto que representa cada família no carrossel da home é uma tabela
  fixa: uma família criada no painel não tem como escolher o seu.

## Decisão

Cinco **documentos de conteúdo**, um por tela do painel, guardados inteiros
numa tabela `site_content` (chave + JSON):

| Chave | Tela | O que guarda |
| --- | --- | --- |
| `settings` | Configurações | Contato, WhatsApp, redes sociais, assuntos do formulário de contato, descrição da empresa para os buscadores |
| `home` | Início | Abertura, "Nossa história", título e representantes das famílias, chamada de receitas, os quatro compromissos |
| `about` | Sobre nós | Subtítulo, parágrafos da história, linha do tempo |
| `privacy` | Privacidade | Política de privacidade |
| `cookies` | Cookies | Política de cookies |

**Documento inteiro, não campo a campo.** O Ipê Ambiente guarda só o que foi
alterado e mescla com o padrão do código na leitura — e é daí que vêm os
defeitos dele: lista reordenada herda campo de outro item, e campo vazio não
existe. Aqui a tela carrega o documento completo (o salvo, ou o padrão
enquanto nada foi salvo) e grava o documento completo.

**O padrão é o conteúdo de hoje.** Os textos atuais viram
`CONTEUDO_PADRAO`, em `packages/core`. Enquanto um documento não é salvo, o
site mostra exatamente o que mostra hoje.

**As regras moram no domínio.** Cada documento tem um normalizador em
`packages/core` que apara espaços, descarta linha em branco e recusa o que
quebraria o site: e-mail sem `@`, rede social fora de `https://`, linha do
tempo vazia, compromissos em número diferente de quatro (os ícones são fixos,
um por posição). A tela mostra a mensagem do domínio.

**Chega ao site pelo mesmo caminho do catálogo** ([0007](0007-conteudo-em-tempo-real.md)):
o conteúdo viaja junto na leitura, no mesmo cache, e é expirado pela mesma
gravação. Um documento salvo que não passa mais no normalizador — formato
antigo, por exemplo — é ignorado, e vale o padrão.

**A reserva acompanha.** `catalog:publish` passa a gravar também
`src/data/content.ts`, para o site sem banco servir o último conteúdo
publicado em vez do padrão de fábrica.

**Números que se calculam sozinhos.** O texto dos compromissos aceita
`{produtos}` e `{familias}`, trocados pela contagem do catálogo. Sem isso,
"105 produtos em 8 famílias" envelheceria na primeira edição.

Alternativas descartadas:

- **Uma tabela por tipo de conteúdo.** Colunas para telefone, tabela para
  linha do tempo, outra para seções legais: seis migrações para conteúdo que
  nunca é consultado por campo.
- **Editor de texto rico.** Os textos são parágrafos simples. Um parágrafo
  por campo resolve sem biblioteca e sem HTML salvo no banco.
- **Editar nome e slogan da marca.** Estão no logotipo e em dezenas de textos
  alternativos; mudar um sem os outros deixaria o site incoerente.

## Critérios de aceite

- [x] Dado nenhum documento salvo, então o site mostra o conteúdo de hoje.
- [x] Dado o telefone alterado em Configurações, então o rodapé e a página
      Contato mostram o novo, sem publicação.
- [x] Dado o WhatsApp deixado em branco, então o botão some do cabeçalho e do
      rodapé.
- [x] Dado um e-mail sem `@`, ou uma rede social sem `https://`, então a
      gravação é recusada com a mensagem do domínio.
- [x] Dado o endereço não conferido, então o site não publica `LocalBusiness`;
      marcado como conferido, passa a publicar.
- [x] Dado o título da abertura alterado em Início, então a home mostra o
      novo.
- [x] Dado um representante escolhido para uma família, então o carrossel da
      home usa a foto dele.
- [x] Dado um compromisso com `{produtos}`, então o site mostra a contagem
      atual do catálogo.
- [x] Dado um marco acrescentado à linha do tempo, então ele aparece na página
      Sobre, na posição escolhida.
- [x] Dada uma seção alterada na política de privacidade, então a página
      mostra o novo texto.
- [x] Dado um documento salvo num formato que o domínio não aceita mais, então
      o site mostra o padrão em vez de quebrar.
- [x] Dado um formulário com alteração não salva, então a tela avisa antes de
      sair.

## Fora do escopo

Título e descrição de SEO por página. Fotos — hero, história e arquivo da
página Sobre continuam sendo arquivos, até a [0005](0005-upload-de-imagens-no-painel.md).
Envio dos formulários de contato e newsletter. Rascunho, pré-visualização e
histórico de versões.

## Onde isso vive

- Tipos, normalizadores e contagens: `packages/core/src/domain/site-content.ts`
- Conteúdo padrão: `packages/core/src/domain/site-content-defaults.ts`
- Casos de uso: `packages/core/src/use-cases/site-content.ts`
- Tabela e adaptador: `packages/db/src/schema/content.ts`,
  `packages/db/src/repositories/content.ts`
- API: `packages/api/src/routers/content.ts`
- Telas: `apps/web/src/routes/admin.{configuracoes,inicio,sobre,privacidade,cookies}.tsx`,
  `components/admin/{form-kit,legal-editor}.tsx`
- Site: `apps/web/src/lib/site-content.ts` e os componentes de `home/`,
  `about/`, `contact/`, `layout/` e `legal/`
- Reserva: `apps/web/src/data/content.ts`, gerado por `catalog:publish`
- Testes:
  - `packages/core/src/use-cases/site-content.test.ts` — padrão, cada regra de
    recusa, contagens e documento em formato antigo
  - `packages/db/src/repositories/content.integration.test.ts` — ida e volta
    pelo `jsonb`
  - `apps/web/src/lib/structured-data.test.ts` — endereço conferido e
    `LocalBusiness`
  - `apps/web/e2e/com-banco/admin-conteudo.spec.ts` — do painel ao site, um
    teste por documento, e o aviso de alteração não salva

O aviso do navegador ao fechar a aba com alteração pendente (`beforeunload`)
não tem teste automatizado: o Playwright dispensa esse diálogo. O que o e2e
confere é o estado "Há alterações não salvas." e o botão de salvar.
