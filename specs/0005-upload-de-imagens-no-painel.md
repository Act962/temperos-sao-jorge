# 0005 — Upload de imagens no painel

- **Estado:** proposta
- **Data:** 2026-09-02

## Problema

A [0004](0004-imagens-no-r2.md) decidiu o R2 e construiu a camada de baixo —
chave, portas, casos de uso, adaptadores e testes —, mas deixou tudo
desligado: o site continua servindo `public/images/` e trocar uma foto continua
exigindo Git. O problema que a 0004 nomeou segue de pé; o que ela entregou foi
o terreno.

O que faltava para ligar era a hospedagem, porque ela decide onde o
processamento roda.

## Decisão

### O app vai para a Vercel; a Cloudflare entra só com R2 e CDN

Com isso o runtime do servidor é **Node**, e a consequência que importa é que
`sharp` continua valendo. Se o servidor fosse para Workers, ele não rodaria —
Workers executa isolates V8 sem addons nativos, e `nodejs_compat` não cobre
binário nativo. Nesse cenário o recorte teria que ser reimplementado em
WebAssembly ou empurrado para o navegador, e nenhum dos dois é de graça.

O `SharpImageProcessor` de `packages/media` é, portanto, o adaptador
definitivo, e não um andaime.

Vale registrar o que **não** resolve o problema, para não ser proposto de novo:
o Cloudflare Images redimensiona e converte na entrega, mas o `trim` dele é por
medidas fixas, não sensível ao conteúdo. O recorte da moldura transparente —
que levou o sachê de 59% para 92% da altura da peça — não tem como acontecer no
momento da entrega. Ele é de upload.

### Fica parado até a validação com o cliente

O site segue estático como está. Ligar o upload agora significaria migrar os
105 packshots e trocar `Product.image` de caminho para chave, e é trabalho que
não se desfaz de graça se a validação mudar alguma premissa.

## O que entra quando destravar

1. Provisionar no painel da Cloudflare: bucket, token de API e domínio público
   do CDN. É do cliente, não do repositório — a chave secreta nunca passa por
   aqui.
2. Rota de upload no admin, chamando `guardarPackshot` com os adaptadores de
   `packages/media`.
3. Campo de arquivo com pré-visualização no lugar da caixa de texto do
   packshot, em `product-dialog.tsx` e `recipe-form.tsx`.
4. Migrar os 105 packshots existentes: `public/images/products/<f>/<s>.webp`
   vira a chave `products/<f>/<s>.webp` — transformação de string, que é o
   motivo de a chave ter sido desenhada assim.
5. `Product.image` passa a guardar a chave; a publicação emite a URL do CDN.
6. Sair de `public/images/products/` e do histórico do Git.

## Critérios de aceite

*A completar quando a fatia começar.* O que já se sabe:

- [ ] Dado um PNG de 5000 px enviado pelo painel, quando o upload termina,
      então o bucket tem um WebP de 600 px recortado, e a tela mostra a nova
      foto sem recarregar.
- [ ] Dado um arquivo acima do limite ou de tipo não aceito, quando é
      escolhido, então é recusado antes de subir.
- [ ] Dado o site publicado depois da migração, quando uma página de produto é
      aberta, então a foto vem do CDN e o site continua subindo sem banco.
- [ ] Dado o pacote de funções da Vercel, quando o build roda, então cabe no
      limite de tamanho com `sharp` incluído — a verificar cedo, porque
      `sharp` carrega binários e o limite é por função.

## Fora do escopo

Variações de tamanho por dispositivo (`srcset`) e transformação na entrega.
Primeiro um tamanho, que é o que o site usa hoje.

## Onde isso vive

A escrever na implementação. A camada de baixo já está em
`packages/core/src/{domain/image,ports/image-storage,use-cases/images}.ts` e
`packages/media/`.
