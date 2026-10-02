# 0010 — Envio de fotos pelo painel

- **Estado:** implementada
- **Data:** 2026-10-02
- **Substitui:** [0005](0005-upload-de-imagens-no-painel.md), que ficou parada
  à espera da validação com o cliente e nunca foi implementada.

## Problema

O painel edita tudo no site, menos a foto. No produto e na receita o campo é
uma caixa de texto que pede um caminho de arquivo — o que só serve a quem tem o
repositório clonado e roda `pnpm run images:products`. A visão geral conta
quantos produtos e receitas estão sem foto, e quem lê o número não tem como
resolver.

A [0004](0004-imagens-no-r2.md) deixou pronta a camada de baixo (chave,
portas, casos de uso, adaptador do R2 e o tratamento com `sharp`), e a
[0005](0005-upload-de-imagens-no-painel.md) listou o que faltava. Desde então
duas coisas mudaram: o app está na Vercel, e salvar no painel passou a ser
publicar ([0007](0007-conteudo-em-tempo-real.md)). As duas mexem no desenho.

## Decisão

### A foto é enviada junto com o salvar

Quem edita escolhe o arquivo, vê a prévia na hora e clica em **Salvar** — um
gesto só, como no resto do painel. Por baixo são dois passos: a foto sobe, é
tratada e guardada; depois o produto (ou a receita) é gravado apontando para
ela.

Alternativa descartada: subir no momento em que o arquivo é escolhido. Mostra
a foto já recortada antes de salvar, mas deixa um arquivo órfão no bucket toda
vez que alguém escolhe uma foto e cancela, e exige nome e família preenchidos
antes de escolher o arquivo.

### O navegador reduz a foto antes de enviar

A Vercel recusa requisição com corpo acima de 4,5 MB, e os originais da marca
têm de 3 a 9 MB. Antes de enviar, o painel redesenha a foto com no máximo
2000 px na maior aresta — PNG quando o original pode ter transparência, JPEG
quando não. O tratamento final continua no servidor: é ele que recorta a
moldura transparente, e 2000 px sobram para os 600 px do packshot.

Se mesmo reduzida a foto passar de 4 MB, o painel tenta de novo em 1500 e
1100 px antes de desistir com uma mensagem.

Alternativa descartada: URL assinada, com o navegador enviando o original
direto ao bucket. Preserva o arquivo inteiro, que ninguém usa, e cobra por
isso configuração de CORS no bucket, um prefixo de arquivos temporários com
regra de expiração e um segundo caminho de escrita no bucket fora do servidor.

Consequência: **TIFF sai da lista do painel**, porque navegador não abre TIFF.
O domínio continua aceitando para quem usar os casos de uso por script.

### A chave ganha uma versão

`products/<familia>/<slug>-<versao>.webp`, com a versão gerada a cada envio.

A 0004 guarda os arquivos com cache de um ano, imutável, e a chave era só
`<slug>.webp`. Trocar a foto de um produto manteria o endereço, e quem já
visitou o site continuaria vendo a antiga por um ano — o contrário de "salvou,
está no ar". Com a versão no nome, foto nova é endereço novo, e o cache longo
continua certo.

A foto anterior é apagada do bucket depois que a gravação dá certo. Se o
apagar falhar, fica registrado no log e a gravação não é desfeita: arquivo
sobrando no bucket não aparece para ninguém.

### O campo `image` aceita os dois mundos

`image` passa a guardar **ou** o caminho antigo (`/images/products/...`,
servido de `public/`) **ou** a chave do bucket (`products/...`). Quem monta o
catálogo publicado transforma chave em endereço do CDN; caminho antigo passa
como está.

É o que permite ligar o envio sem migrar os 105 packshots no mesmo dia, e sem
o site depender do bucket para as fotos que já existem.

A regra "o packshot tem que estar na pasta da família do produto" continua
valendo para os caminhos antigos, onde protege contra erro de digitação. Para
chave do bucket ela **não vale**: a foto foi enviada para aquele produto, e
exigir a pasta obrigaria a reenviar a foto de todo produto que muda de
família.

### Receita tem tratamento próprio

A 0004 passava a foto da receita pelo tratamento do packshot (recorte de
transparência, 600 px). Foto de prato é fotografia, não tem moldura
transparente e aparece maior: vai para 1600 px na maior aresta, WebP com
qualidade 80, sem recorte.

### Sem bucket configurado, o painel avisa e o resto funciona

As variáveis `R2_*` continuam opcionais. Sem elas, o campo de foto aparece
desativado com a explicação, e o produto pode ser salvo normalmente. O site
público não muda: continua subindo sem banco e sem bucket.

`sharp` e o cliente S3 só são carregados dentro da rota de envio, por
`import()` dinâmico.

## Critérios de aceite

- [x] Dado um produto sem foto, quando escolho um PNG e salvo, então a lista do
      painel mostra a foto nova sem recarregar e a página do produto no site a
      exibe, vinda do endereço público do bucket.
- [x] Dado um PNG de 5000 px com moldura transparente, quando é enviado, então
      o bucket recebe um WebP de no máximo 600 px recortado ao produto.
- [x] Dado um produto com foto do bucket, quando envio outra, então o endereço
      muda e a foto anterior deixa de existir no bucket.
- [x] Dado um produto com foto, quando clico em remover e salvo, então o site
      mostra o espaço reservado e a visão geral conta um produto sem foto a
      mais.
- [x] Dado um arquivo de tipo não aceito ou acima de 20 MB, quando é escolhido,
      então é recusado na hora, antes de salvar.
- [x] Dada uma receita, quando envio a foto, então ela aparece no cartão e na
      página da receita, com no máximo 1600 px.
- [x] Dado um produto com foto do bucket, quando muda de família, então a
      gravação é aceita e a foto continua a mesma.
- [x] Dado um produto com caminho antigo em `image`, quando o catálogo é
      montado, então o caminho sai intacto.
- [x] Dada uma requisição de envio sem sessão, quando chega, então é recusada
      com 401 e nada é guardado.
- [x] Dado o painel sem as variáveis do bucket, quando abro um produto, então
      o campo de foto está desativado com a explicação e salvar o nome
      funciona.
- [x] Dado o site sem `DATABASE_URL` e sem bucket, quando qualquer página é
      aberta, então responde 200 como antes.
- [x] Dado o pacote da função da Vercel, quando o build roda, então `sharp`
      está dentro dele com o binário da plataforma.

## Fora do escopo

- **Migrar os 105 packshots** de `public/images/products/` para o bucket e
  tirá-los do Git. Deixa de ser pré-requisito; fica para depois que o bucket
  estiver em uso.
- **Fotos das páginas** (abertura da home, história, acervo do Sobre).
- **Provisionar o bucket.** Conta, token e domínio público são do cliente; o
  repositório só lê as variáveis.
- Variações de tamanho por dispositivo (`srcset`) e recorte manual na tela.

## Onde isso vive

- Domínio: `packages/core/src/domain/image.ts` — versão na chave,
  `urlDaImagem`, `FOTO_DE_RECEITA`, `TIPOS_DO_PAINEL`; a conferência do campo
  `image` está em `domain/product.ts` e `domain/recipe.ts`.
- Casos de uso: `packages/core/src/use-cases/images.ts`
  (`guardarPackshot`, `guardarFotoDeReceita`, `descartarFotoSubstituida`) e
  `published-catalog.ts`, que transforma chave em endereço.
- Tratamento: `packages/media/src/sharp-processor.ts`.
- Bucket ligado ao ambiente: `packages/api/src/images.ts`; a configuração, sem
  o SDK, em `packages/media/src/config.ts`.
- Rota de envio e de descarte: `packages/api/src/photo-upload.ts`, servida por
  `apps/web/src/routes/api.admin.fotos.ts`.
- Limpeza da foto substituída: `limparFoto`, em
  `packages/api/src/routers/catalog.ts`.
- Tela: `apps/web/src/components/admin/photo-field.tsx` (campo) e `photo.ts`
  (conferência, redução no navegador, envio).
- Bucket local para desenvolvimento e CI:
  `packages/media/scripts/local-bucket.mjs`.
- Testes:
  - regras, sem rede — `packages/core/src/use-cases/photo-upload.test.ts`
  - tratamento da foto de receita — `packages/media/src/sharp-processor.test.ts`
  - conferência e redução — `apps/web/src/components/admin/photo.test.ts`
  - estados do campo, inclusive sem bucket —
    `apps/web/src/components/admin/photo-field.test.tsx`
  - de ponta a ponta, contra bucket de verdade —
    `apps/web/e2e/com-banco/admin-fotos.spec.ts`

### O que ficou sem teste automático

- A mudança de família de um produto com foto do bucket é provada no domínio,
  não pela tela: o e2e divide o banco com suítes que contam produtos por
  família.
- O `sharp` dentro da função da Vercel foi conferido empacotando no Windows. O
  binário de Linux só é exercitado no deploy.
- O adaptador rodou contra MinIO. Contra o R2 em si ainda não: falta o bucket.
