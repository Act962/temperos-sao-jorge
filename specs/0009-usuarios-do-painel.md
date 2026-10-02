# 0009 — Usuários do painel

- **Estado:** implementada
- **Data:** 2026-10-01

## Problema

Dois problemas, um de uso e um de segurança.

- Não há tela de usuários. A [0002](0002-painel-de-produtos.md) deixou o
  cadastro fora do escopo: o primeiro acesso se cria com um `curl` em
  `/api/auth/sign-up/email`, e os seguintes também. Ninguém troca a própria
  senha.
- Esse mesmo endereço é público. Qualquer pessoa que o conheça cria uma conta
  e entra no painel — e, desde a [0007](0007-conteudo-em-tempo-real.md), o que
  o painel grava vai ao ar na hora. Todo usuário autenticado é administrador.

## Decisão

**Tela de usuários** em `/admin/usuarios`: listar, criar (nome, e-mail e
senha) e remover. Quem está logado troca a própria senha ali.

**Cadastro pelo site fecha depois do primeiro usuário.**
`/api/auth/sign-up/email` só responde enquanto não existe usuário nenhum — é
o que permite o primeiro acesso num banco vazio, e o preparo do e2e. Com um
usuário cadastrado, responde 403, e conta nova só nasce pela tela, por quem já
está dentro.

A barreira fica na rota HTTP, não num gancho do Better-Auth: a criação pela
tela usa a API do Better-Auth do lado do servidor, e um gancho barraria as
duas. A rota é o único caminho de fora para dentro.

**Regras no domínio**, atrás de uma porta `UserDirectory` — o Better-Auth é o
adaptador:

- e-mail já cadastrado é recusado;
- senha tem no mínimo 8 caracteres;
- ninguém remove a si mesmo;
- o último usuário não pode ser removido, ou o painel ficaria sem dono e o
  cadastro pelo site reabriria.

Alternativas descartadas:

- **Plugin `admin` do Better-Auth.** Traz papéis, banimento e personificação;
  o painel tem um papel só.
- **`disableSignUp`.** Fecha também o primeiro acesso, e a saída seria um
  script de linha de comando — que é o que esta spec quer aposentar.
- **Convite por e-mail.** O projeto não tem envio de e-mail.

## Critérios de aceite

- [x] Dado um banco sem usuários, quando alguém se cadastra pelo site, então a
      conta é criada.
- [x] Dado um banco com usuário, quando alguém se cadastra pelo site, então
      recebe 403 e nenhuma conta é criada.
- [x] Dado um usuário criado pela tela, então ele entra no painel com a senha
      definida.
- [x] Dado um e-mail já cadastrado, então a criação é recusada com a mensagem
      do domínio.
- [x] Dada uma senha com menos de 8 caracteres, então a criação é recusada.
- [x] Dado o próprio usuário, então a tela não oferece removê-lo, e o domínio
      recusa se pedirem.
- [x] Dado o último usuário, então o domínio recusa removê-lo.
- [x] Dado um usuário removido, então ele não consegue mais entrar.

## Fora do escopo

Papéis e permissões. Recuperação de senha por e-mail. Registro de quem
alterou o quê.

## Onde isso vive

- Regras: `packages/core/src/domain/user.ts`,
  `packages/core/src/use-cases/users.ts`
- Porta e adaptador: `packages/core/src/ports/user-directory.ts`,
  `packages/auth/src/user-directory.ts`, `packages/db/src/repositories/users.ts`
- API: `packages/api/src/routers/users.ts`
- Barreira do cadastro público: `apps/web/src/routes/api.auth.$.ts`
- Tela: `apps/web/src/routes/admin.usuarios.tsx`
- Testes:
  - `packages/core/src/use-cases/users.test.ts` — todas as regras, em memória
  - `apps/web/e2e/com-banco/preparo.setup.ts` — cadastro pelo site num banco
    sem usuários
  - `apps/web/e2e/com-banco/admin-usuarios.spec.ts` — 403 no cadastro público,
    criação e login pela tela, remoção e perda de acesso
