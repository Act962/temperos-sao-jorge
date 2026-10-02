# Guia de deploy

Como colocar o site e o painel no ar, do zero, e o que cada variável de
ambiente faz. O porquê das decisões de empacotamento está no
[README](../README.md#deploy); aqui fica o passo a passo.

## Visão geral

| Peça | Onde roda | Obrigatória? |
| --- | --- | --- |
| Site e painel | Vercel | sim |
| Banco (Postgres) | um provedor com conexão em pool | para o painel e para a edição no ar |
| Fotos enviadas pelo painel | Cloudflare R2 | não — sem ele o campo de foto fica desligado |

O site foi feito para degradar, não para cair:

- **Sem banco**, todas as páginas respondem com a reserva de
  `apps/web/src/data/`, e o painel avisa que está indisponível.
- **Sem bucket**, tudo funciona, menos o envio de fotos.

Por isso dá para subir em etapas: primeiro o site, depois o banco, depois o
bucket.

## Variáveis de ambiente

Todas entram no projeto da Vercel, em **Settings → Environment Variables**.
Depois de criar ou alterar qualquer uma, é preciso **fazer um novo deploy**:
as variáveis só valem para deploys feitos depois delas.

### Para o painel e a edição no ar

As três andam juntas. O servidor valida as três de uma vez: com uma faltando,
o site cai na reserva e o painel fica indisponível.

| Variável | O que é | Exemplo |
| --- | --- | --- |
| `DATABASE_URL` | Endereço do Postgres. Use a conexão **em pool** do provedor: cada função da Vercel abre as próprias conexões, e a conexão direta esgota o limite do banco. | `postgres://usuario:senha@host:6543/banco` |
| `BETTER_AUTH_SECRET` | Segredo que assina as sessões do painel. No mínimo 32 caracteres. Trocar o valor derruba todas as sessões abertas. | saída de `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Origem em que o painel é acessado, com `https://` e sem barra no fim. O login só funciona a partir desta origem exata. | `https://alimentossaojorge.com` |

### Para o endereço do site

| Variável | O que é | Exemplo |
| --- | --- | --- |
| `VITE_SITE_URL` | Origem pública: canonical, Open Graph, `sitemap.xml` e `robots.txt`. É embutida **no build**. Sem ela, vale o padrão `https://alimentossaojorge.com`, então só é preciso definir se o domínio for outro. | `https://alimentossaojorge.com` |

O canonical usa o domínio sem `www`. Configure o `www` para redirecionar para
ele, e não o contrário. `BETTER_AUTH_URL` e `VITE_SITE_URL` devem apontar para
a mesma origem.

### Para o envio de fotos (opcional)

As cinco andam juntas. Faltando qualquer uma, o campo de foto aparece
desligado no painel.

| Variável | O que é | Exemplo |
| --- | --- | --- |
| `R2_ACCOUNT_ID` | ID da conta na Cloudflare. O endereço da API do bucket é montado a partir dele. | `a1b2c3…` |
| `R2_BUCKET` | Nome do bucket. | `sao-jorge` |
| `R2_ACCESS_KEY_ID` | Chave do token de API do R2. | — |
| `R2_SECRET_ACCESS_KEY` | Segredo do mesmo token. | — |
| `R2_PUBLIC_URL` | Endereço de onde o navegador baixa as fotos: o domínio ligado ao bucket, sem barra no fim. | `https://imagens.alimentossaojorge.com` |

`R2_ENDPOINT` **não** vai para produção: existe só para apontar o app a um
MinIO local.

### O que não definir

- `NODE_ENV` — a Vercel define sozinha. É ela que liga o cookie de sessão
  seguro (`secure`) em produção.
- `SKIP_ENV_VALIDATION` — desliga a conferência das variáveis e troca um erro
  claro no começo por um erro obscuro depois.

### Resumo para copiar

```bash
# Painel e edição no ar
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=https://alimentossaojorge.com

# Endereço do site (opcional: este já é o padrão)
VITE_SITE_URL=https://alimentossaojorge.com

# Envio de fotos (opcional)
R2_ACCOUNT_ID=
R2_BUCKET=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_PUBLIC_URL=
```

## Primeiro deploy, passo a passo

### 1. Projeto na Vercel

- **Root Directory:** `apps/web`. É lá que está o `vercel.json`, que já define
  o comando de instalação, o de build (`pnpm run build:vercel`) e
  `framework: null`. Não é preciso preencher esses campos no painel da Vercel.
- **Node:** 22. A função é empacotada para `nodejs22.x`.

Neste ponto o site já sobe e responde, servindo a reserva.

### 2. Banco

Crie o Postgres e copie a string de conexão **em pool**.

Aplique o schema a partir da sua máquina, na raiz do repositório:

```bash
DATABASE_URL="postgres://…" pnpm run db:push
```

Cria as tabelas do catálogo, do conteúdo do site (`site_content`) e as do
login.

### 3. Carga inicial do catálogo — uma vez só

```bash
DATABASE_URL="postgres://…" pnpm run catalog:seed
```

Leva para o banco os 105 produtos, as famílias e as receitas que estão em
`apps/web/src/data/`.

> **Só no banco vazio.** Este comando **apaga** produtos, famílias, receitas e
> os textos das páginas antes de gravar. Rodado depois que a marca começou a
> editar pelo painel, ele desfaz tudo o que foi editado.

### 4. Variáveis e novo deploy

Cadastre na Vercel `DATABASE_URL`, `BETTER_AUTH_SECRET` e `BETTER_AUTH_URL`, e
faça um novo deploy.

Sobre o ambiente **Preview**: um deploy de preview com a `DATABASE_URL` de
produção grava no banco de produção. Deixe as variáveis do banco só em
**Production**, ou aponte o Preview para um banco separado. Sem elas, o
preview mostra o site com a reserva e o painel indisponível — o suficiente
para revisar o site.

### 5. Primeiro usuário — logo depois do deploy

O painel não tem tela de cadastro. A primeira conta é criada por este
endereço, que só responde enquanto o banco não tem nenhum usuário:

```bash
curl -X POST https://alimentossaojorge.com/api/auth/sign-up/email -H "Content-Type: application/json" -H "Origin: https://alimentossaojorge.com" -d '{"email":"voce@alimentossaojorge.com","password":"uma-senha-forte","name":"Seu Nome"}'
```

Faça isso **assim que o deploy com banco estiver no ar**: até existir a
primeira conta, quem conhecer o endereço pode criá-la. Depois da primeira, o
endereço devolve 403, e os outros acessos são criados em `/admin/usuarios`.

O valor de `Origin` tem que ser igual a `BETTER_AUTH_URL`.

### 6. Conferir

- [ ] A home abre e mostra produtos e receitas.
- [ ] `/admin` mostra a tela de acesso, e o login entra.
- [ ] A visão geral do painel mostra as contagens (105 produtos).
- [ ] Renomear um produto no painel e recarregar a página dele no site: o
      nome novo aparece. Desfaça em seguida.
- [ ] `/sitemap.xml` e `/robots.txt` trazem o domínio certo.
- [ ] Em `/admin/configuracoes`, trocar telefone, endereço e WhatsApp pelos
      verdadeiros — os que vêm de fábrica são exemplos — e marcar o endereço
      como conferido.

O teste de renomear confere o cache: o site guarda o catálogo e o painel o
expira a cada gravação. Se o nome novo **não** aparecer em seguida, a
expiração não está chegando, e as alterações só entram depois de até uma
hora. Isso ainda não foi observado em produção — vale conferir neste primeiro
deploy.

## Ligando o envio de fotos

Pode ser feito depois, sem pressa: até lá o campo de foto aparece desligado,
com a explicação.

1. No painel da Cloudflare, em **R2**, crie o bucket.
2. Ligue um **domínio público** ao bucket (por exemplo
   `imagens.alimentossaojorge.com`). É esse endereço que vai em
   `R2_PUBLIC_URL`. O domínio precisa servir os arquivos sem autenticação.
3. Crie um **token de API do R2** com permissão de leitura e escrita de
   objetos, restrito a esse bucket. O app precisa gravar, ler e apagar.
   A chave e o segredo aparecem uma vez só.
4. Cadastre as cinco variáveis `R2_*` na Vercel e faça um novo deploy.
5. Confira: em `/admin/produtos`, edite um produto, escolha uma foto e salve.
   A miniatura da lista e a página do produto no site devem mostrar a foto
   nova, vinda do domínio do bucket.

Não é preciso configurar CORS no bucket: quem grava é o servidor, e o
navegador só baixa imagens.

O envio já foi exercitado de ponta a ponta contra um MinIO, que fala a mesma
API do R2, mas **ainda não contra o R2 em si** — o passo 5 é a primeira
conferência de verdade.

## Deploys seguintes

A cada push em `main`, a Vercel faz o deploy sozinha. Dois cuidados:

**Mudou o schema do banco?** Rode `db:push` contra a produção **antes** do
deploy que precisa da mudança. O PR diz quando é o caso.

```bash
DATABASE_URL="postgres://…" pnpm run db:push
```

**Atualizar a reserva.** A reserva é o que o site mostra se o banco sair do
ar, e ela só anda quando alguém roda:

```bash
DATABASE_URL="postgres://…" R2_PUBLIC_URL="https://imagens…" pnpm run catalog:publish
```

O comando lê o banco e regrava `apps/web/src/data/`; o resultado vai num
commit. Não é necessário para o conteúdo ir ao ar — salvar no painel já
publica —, mas sem ele a reserva fica cada vez mais atrás do que a marca
editou. `R2_PUBLIC_URL` só é preciso depois que houver fotos no bucket.

## Quando algo não funciona

| Sintoma | Causa provável |
| --- | --- |
| Painel diz "Administração indisponível" | Falta uma das três variáveis do banco e do login, ou o banco não responde. Veja o log da função na Vercel. |
| Login recusa com senha certa | `BETTER_AUTH_URL` diferente da origem em que você está acessando (`www` contra sem `www`, `http` contra `https`). |
| O `curl` do primeiro usuário devolve 403 | Já existe um usuário, ou o `Origin` não bate com `BETTER_AUTH_URL`. |
| Site mostra conteúdo antigo depois de salvar no painel | O banco está fora e o site caiu na reserva, ou a expiração do cache não chegou (veja "Conferir"). |
| Painel dá erro ao salvar textos das páginas | Falta a tabela `site_content`: rode `db:push`. |
| Campo de foto desligado | Falta uma das variáveis `R2_*`, ou o deploy é anterior a elas. |
| Foto enviada não aparece no site | `R2_PUBLIC_URL` não aponta para o domínio público do bucket, ou o domínio não está servindo sem autenticação. |
| Erro de "too many connections" no banco | `DATABASE_URL` é a conexão direta, não a em pool. |
