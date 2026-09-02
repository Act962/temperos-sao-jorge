---
name: spec-primeiro
description: Escrever ou atualizar uma especificação em specs/ antes de implementar. Use ao começar qualquer mudança de comportamento — regra de negócio nova, fatia do admin, mudança no modelo de conteúdo ou no que o site publica.
---

# Spec antes do código

Neste repositório a decisão é registrada antes de virar código. O diretório
`specs/` é a memória do **porquê**; o Git guarda o **o quê**.

## Quando parar e escrever uma spec

Escreva quando a mudança altera comportamento observável: regra de negócio,
modelo de conteúdo, uma fatia do painel, o que aparece no site publicado.

Vá direto ao código quando for espaçamento, cor, renomear componente,
corrigir digitação ou refatorar sem mudar comportamento. Spec para isso é
cerimônia, e cerimônia faz as pessoas pararem de ler as specs que importam.

## Como escrever

Copie `specs/0000-modelo.md` para `specs/NNNN-nome-curto.md`, com o próximo
número livre. Preencha:

- **Problema** em fatos, não em solução. Se não dói, a spec não precisa
  existir.
- **Decisão** com as alternativas descartadas e o motivo. É essa parte que
  impede alguém de refazer a discussão em seis meses.
- **Critérios de aceite** no formato "dado ..., quando ..., então ...", cada
  um verificável por quem não escreveu o código.
- **Fora do escopo**, para a fatia não crescer sozinha.

Atualize a tabela de estado em `specs/README.md`.

## Depois de implementar

Cada critério de aceite vira um teste — `packages/core` para regra,
`apps/web/src/**/*.test.ts(x)` para componente, `apps/web/e2e/` para o que só
aparece no navegador. Marque os critérios, mude o estado para `implementada` e
preencha "Onde isso vive".

Spec implementada não se reescreve. Se a decisão mudar, escreva uma nova que
substitua a anterior e registre a substituição nas duas.
