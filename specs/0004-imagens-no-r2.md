# 0004 — Fotos em object storage (Cloudflare R2)

- **Estado:** implementada
- **Data:** 2026-09-02

## Problema

As fotos entram por um script rodado na máquina de quem tem o repositório
clonado (`pnpm run images:products`), que grava WebP em
`apps/web/public/images/`. Duas consequências:

- **A equipe da marca não consegue trocar uma foto.** O painel resolveu nome,
  família e receita, mas a imagem continua exigindo Git. É o que impede a
  administração de ser autossuficiente.
- **Binário em Git é permanente.** São 4,7 MB versionados hoje. Toda foto
  substituída fica no histórico para sempre: trocar um packshot dez vezes ao
  longo de dois anos deixa dez cópias no clone de todo mundo, incluindo as nove
  que ninguém quer. Um script que grava em `public/` não tem como escapar
  disso.

## Decisão

As fotos passam a viver em **object storage no Cloudflare R2**, servidas por
CDN. O R2 foi escolhido por não cobrar egresso — imagem é justamente o tipo de
arquivo cujo custo mora na saída — e por ser compatível com a API S3, o que
mantém a porta implementável por qualquer outro provedor sem reescrever o
domínio.

Alternativas descartadas:

- **Manter o script e só conferir se o caminho existe.** Tira o erro silencioso
  e não tira o Git do caminho, que é o problema real.
- **Bucket como área de upload, com a publicação baixando tudo para dentro do
  build.** Preserva o site sem nenhuma dependência de runtime, mas só compensa
  se as fotos forem poucas e mudarem raramente. Não é o caso.

### O que isso custa, e é consciente

Até aqui o site público sobe **sem nada** — sem Postgres, sem serviço externo.
Servir imagem de bucket introduz a primeira dependência de runtime que ele vai
ter. Aceita por três motivos: um CDN é outra classe de confiabilidade que um
banco; o site já degrada para a placa da marca quando uma imagem falha; e a
alternativa mantém o Git no caminho.

### Esta fatia para o domínio e os adaptadores, não a tela

O site continua **estático e servindo `public/images/` como hoje**. Nada muda
para quem visita, e `Product.image` continua sendo o caminho que já é.

O que entra agora é a camada de baixo, pronta para ser ligada: o tipo da chave,
as portas, os adaptadores e os testes. É o contrário de adiantar trabalho — é o
que permite ligar a tela depois sem descobrir, no meio, que a regra estava
errada.

### A chave é do domínio; a URL é do adaptador

O domínio conhece `products/<familia>/<slug>.webp`, e só. O host do CDN é
configuração, e quem monta a URL pública é o adaptador. Sem isso o domínio
passaria a carregar um endereço de infraestrutura, e trocar de provedor viraria
mudança de regra de negócio.

A chave foi desenhada para ser o caminho de hoje **menos o prefixo
`/images/`**. A migração vira uma transformação de string, e durante a
transição a mesma chave descreve os dois mundos.

### `sharp` fica atrás de uma porta

O recorte, o redimensionamento e o WebP são regra — 600 px na maior aresta,
margem uniforme de 22 px, qualidade 82 — mas `sharp` é binário nativo, que não
pode entrar em `packages/core`. Os números ficam no domínio; a execução, no
adaptador.

## Critérios de aceite

- [x] Dada uma família e um slug, quando a chave do packshot é derivada, então
      é `products/<familia>/<slug>.webp`.
- [x] Dada uma chave fora do formato, quando ela é validada, então o domínio
      recusa dizendo o formato esperado.
- [x] Dado um arquivo de tipo não aceito, ou acima do tamanho máximo, quando o
      envio é validado, então é recusado antes de qualquer byte ir para a rede.
- [x] Dado um packshot guardado, quando a família do produto muda, então a
      chave antiga aponta para a pasta errada e a operação é recusada — a mesma
      regra que hoje protege o caminho no disco.
- [x] Dado um armazenamento em memória, quando os casos de uso rodam, então
      passam sem rede e sem credencial.
- [x] Dado um serviço compatível com S3 no ar, quando o adaptador guarda, lê,
      lista e apaga, então o conteúdo e o tipo voltam intactos.
- [x] Dada a ausência de credenciais, quando a suíte roda, então os testes do
      adaptador se pulam sozinhos.
- [x] Dado o site publicado, quando qualquer página é aberta, então nada mudou:
      as fotos continuam vindo de `public/images/`.

## Fora do escopo

Fica para a próxima fatia, quando a hospedagem estiver definida:

- O campo de upload no painel, com pré-visualização.
- A migração dos 105 packshots existentes para o bucket.
- A troca de `Product.image` de caminho para chave, e a publicação passando a
  emitir URLs do CDN.
- Provisionar o bucket, as credenciais e o domínio do CDN.

## Onde isso vive

- Domínio: `packages/core/src/domain/image.ts` — a chave, o enquadramento do
  packshot e a validação do envio.
- Portas: `packages/core/src/ports/image-storage.ts` — `ImageStorage` e
  `ImageProcessor`, separadas porque guardar bytes e tratar bytes são infra
  diferentes.
- Casos de uso: `packages/core/src/use-cases/images.ts`.
- Dublês: `packages/core/src/testing/in-memory-image-storage.ts`.
- Adaptadores: `packages/media/src/{r2-storage,sharp-processor}.ts`.
- Testes:
  - domínio e casos de uso, sem rede — `packages/core/src/use-cases/images.test.ts`
  - o recorte, o redimensionamento e a margem com `sharp` de verdade —
    `packages/media/src/sharp-processor.test.ts`
  - o adaptador contra uma API S3 real, pulando sem credencial —
    `packages/media/src/r2-storage.integration.test.ts`

O adaptador foi exercitado contra MinIO, que fala a mesma API do R2. Contra o
bucket do R2 em si ele ainda não rodou — falta a conta, que entra na fatia
seguinte.
