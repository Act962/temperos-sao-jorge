# Imagens

Todo caminho abaixo é relativo a `apps/web/public/`. Enquanto um arquivo não
existir, o slot correspondente renderiza um placeholder da marca em vez de
imagem quebrada — nenhuma alteração de código é necessária para preenchê-lo.

## Prontas

| Arquivo | Origem |
| --- | --- |
| `images/hero.webp` (1200×800) | projeto do Claude Design |
| `images/logo-sao-jorge.png` (640×313) | master da marca, reduzido — veja abaixo |
| `images/products/**` (105 WebP) | pasta `FAMILIAS`, convertida pelo pipeline abaixo |
| `favicon.ico`, `favicon-32.png`, `favicon-192.png`, `apple-touch-icon.png` | gerados do master da marca |

### Logo

O master é `apps/web/assets-src/logo-sao-jorge.png` (9786×4779, 1,7 MB). Ele fica
**fora** de `public/` de propósito: assim não vai para o deploy, mas continua
versionado. A versão servida tem 640 px de largura e 47 KB, o que dá 6× de
resolução no header (106×52) e 3,8× no rodapé (168×82).

Para regerar depois de trocar o master:

```bash
node -e "require('sharp')('apps/web/assets-src/logo-sao-jorge.png').resize({width:640}).png({compressionLevel:9,palette:true}).toFile('apps/web/public/images/logo-sao-jorge.png')"
```

### Ícones

Gerados do mesmo master, por `scripts/generate-favicons.mjs`:

```bash
pnpm run images:favicons
```

O logotipo é 2:1, então um recorte quadrado cortaria a palavra. A composição
encaixa a marca inteira num campo creme de cantos arredondados e descarta a
tagline em arco (“Mais Sabor em sua Mesa”), ilegível em qualquer tamanho de
favicon. Em tamanho de aba o que se reconhece é a elipse vermelha; a partir de
~48 px “São Jorge / Alimentos” já se lê.

| Arquivo | Uso |
| --- | --- |
| `favicon.ico` | 16/32/48 empacotados, para o pedido automático do navegador |
| `favicon-32.png` | aba |
| `favicon-192.png` | Android e atalhos |
| `apple-touch-icon.png` | iOS — sem cantos arredondados e sem alfa, porque o iOS aplica a própria máscara |

### Pipeline dos packshots

Os originais são PNGs RGBA de ~5000×5000 e 3–9 MB (745 MB no total), para tiles
que nunca passam de ~260 px na tela. O script converte para WebP de 600 px
preservando a transparência:

```bash
pnpm run images:products "C:/caminho/para/FAMILIAS"
```

Resultado da última execução: **745 MB → 2,7 MB** (≈ 26 KB por imagem).

Use `--dry-run` para só conferir o mapeamento. O script aborta se a pasta de
origem e `src/data/products.ts` divergirem, então renomear um arquivo de produto
falha alto em vez de gerar um 404 silencioso.

O nome de destino é o nome do arquivo original em minúsculas, sem acento e com
hífens: `CHÁS/Sachet camomila.png` → `images/products/chas/sachet-camomila.webp`.

## Faltando

### Marca

| Arquivo | Uso | Recomendação |
| --- | --- | --- |
| `images/og-sao-jorge.jpg` | card de compartilhamento | 1200×630; opcional — hoje cai na hero |

### Fotos editoriais

| Arquivo | Uso |
| --- | --- |
| `images/historia.jpg` | seção “Nossa história” na home |
| `images/sobre/frota-antiga.jpg` | galeria de arquivo em Sobre nós |
| `images/sobre/arquivo-1.jpg` | galeria de arquivo em Sobre nós |
| `images/sobre/arquivo-2.jpg` | galeria de arquivo em Sobre nós |

### Receitas

| Arquivo | Receita |
| --- | --- |
| `images/recipes/macarrao-ao-molho-de-tomate-caseiro.jpg` | Macarrão ao Molho de Tomate Caseiro |
| `images/recipes/lasanha-a-bolonhesa.jpg` | Lasanha à Bolonhesa |
| `images/recipes/arroz-a-grega.jpg` | Arroz à Grega |
| `images/recipes/frango-ao-molho-com-legumes.jpg` | Frango ao Molho com Legumes |
| `images/recipes/macarrao-a-primavera.jpg` | Macarrão à Primavera |
| `images/recipes/nhoque-ao-molho-de-queijo.jpg` | Nhoque ao Molho de Queijo |

Formato sugerido: 3:2, largura ≥ 1200 px. O card usa recorte 16:10 e a página da
receita usa 300 px de altura.
