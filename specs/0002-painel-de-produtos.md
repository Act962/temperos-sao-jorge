# 0002 — Painel de administração: produtos

- **Estado:** implementada
- **Data:** 2026-09-02

## Problema

A [0001](0001-catalogo-no-banco.md) colocou o catálogo no banco, mas a única
forma de mexer nele continuava sendo SQL na mão. Sem tela, a mudança de
arquitetura não entregou nada para quem cuida da marca.

## Decisão

Um painel em `/admin`, na mesma aplicação e na mesma origem do site. Primeira
fatia: produtos e famílias.

Alternativas descartadas:

- **Aplicação separada para o admin.** Segundo deploy, segundo domínio, CORS e
  cookie entre origens — tudo isso para servir três telas.
- **Redirecionar para `/login` sem sessão.** Perde a URL pretendida. O
  formulário de acesso ocupa o lugar do conteúdo, então entrar em
  `/admin/produtos` leva de volta a `/admin/produtos` depois do login.

As regras **não** são repetidas na tela. O formulário não confere caminho de
packshot nem formato de slug: quem decide é `packages/core`, e
`packages/api/src/errors.ts` traduz o erro de domínio em código de transporte
para a mensagem chegar inteira ao usuário. Duplicar a regra no formulário
criaria uma segunda verdade para manter em sincronia.

## Critérios de aceite

- [x] Dado um visitante sem sessão, quando abre qualquer rota do painel, então
      vê o formulário de acesso na própria URL, com resposta 200.
- [x] Dado um visitante sem sessão, quando chama um procedimento protegido,
      então recebe 401.
- [x] Dado o painel aberto, então o cabeçalho, o rodapé e a newsletter do site
      público não aparecem, e não há `<main>` dentro de `<main>`.
- [x] Dado o painel, então suas rotas respondem `noindex, nofollow`.
- [x] Dado um produto de chá, quando a família muda para ervas sem mover a
      foto, então a tela mostra a mensagem do domínio nomeando o arquivo.
- [x] Dado um produto salvo com sucesso, quando a gravação termina, então a
      lista e as contagens da visão geral refletem a mudança sem recarregar a
      página.
- [x] Dado um celular, quando o painel abre, então existe forma de encerrar a
      sessão sem a coluna lateral.

## Fora do escopo

Edição de receitas — fica para a [0003](0003-edicao-de-receitas.md). Upload de
imagem, cadastro de usuários pela tela, papéis e permissões (todo usuário
autenticado é administrador), e um botão de publicar dentro do painel: a
publicação continua sendo comando de terminal.

## Onde isso vive

- Rotas: `apps/web/src/routes/admin.*.tsx`
- Componentes: `apps/web/src/components/admin/`
- API: `packages/api/src/routers/catalog.ts`, `packages/api/src/errors.ts`
- Testes: `apps/web/e2e/admin.spec.ts`,
  `packages/core/src/use-cases/*.test.ts`
