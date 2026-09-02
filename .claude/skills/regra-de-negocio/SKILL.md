---
name: regra-de-negocio
description: Onde colocar regra de negócio, entidade, caso de uso, porta ou adaptador de banco. Use ao mexer em packages/core, packages/db ou packages/api — validação de produto ou receita, repositório novo, erro de domínio.
---

# Onde a regra mora

A arquitetura é hexagonal e a divisão não é decorativa: é ela que permite
testar toda a regra de negócio sem subir servidor nem banco.

```
packages/core   domínio puro + portas + casos de uso   (zero dependências de infra)
packages/db     adaptadores Drizzle das portas          (Postgres)
packages/api    tRPC: valida a forma da entrada e delega
apps/web        telas
```

## Regras que valem sempre

**Nenhum import de infra em `packages/core`.** Nada de Drizzle, tRPC, React ou
`process.env`. Se a regra precisa de dados, ela recebe uma porta por parâmetro.

**Caso de uso recebe o repositório como parâmetro**, não o importa:

```ts
export async function atualizarProduto(
	repo: ProductRepository,
	slug: string,
	alteracoes: Partial<EntradaProduto>,
) { … }
```

É isso que faz `repositoriosEmMemoria()` (em `packages/core/src/testing/`)
substituir o Postgres nos testes sem nenhum truque.

**Valide a causa antes do sintoma.** Confira o que a entidade pressupõe antes
de montá-la. `atualizarProduto` já reclamou da pasta do packshot quando o
problema real era a família não existir — erro certo, causa errada, e nenhuma
pista para quem lê.

**Erros de domínio são tipados**, não strings: `NotFoundError`,
`ConflictError`, `InvalidInputError`, `DomainError`. Só
`packages/api/src/errors.ts` os traduz para HTTP. O domínio nunca conhece
código de status.

**Slug é tipo, não string.** Use `comoSlug` para validar o que chega de fora e
`paraSlug` para derivar de texto livre.

## Ao adicionar um caso de uso

1. Entidade e invariantes em `packages/core/src/domain/`.
2. Porta em `packages/core/src/ports/` — o mínimo que o caso de uso precisa.
3. Caso de uso em `packages/core/src/use-cases/`, recebendo a porta.
4. Teste com repositório em memória. Sem banco, sem mock de biblioteca.
5. Adaptador em `packages/db/src/repositories/`, com teste de integração
   `*.integration.test.ts` — ele se pula sozinho sem `DATABASE_URL`.
6. Procedimento em `packages/api/src/routers/`, envolvido em
   `traduzindoErros`, só validando a forma da entrada com Zod.

Escrever validação de regra no procedimento tRPC ou no formulário cria uma
segunda verdade. A regra é uma só, e ela mora no domínio.
