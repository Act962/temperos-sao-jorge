import { getAuth } from "@my-better-t-app/auth";
import type { CatalogRepositories } from "@my-better-t-app/core";
import { getDb } from "@my-better-t-app/db";
import { repositoriosDrizzle } from "@my-better-t-app/db/repositories/catalog";

export type CreateContextOptions = {
	/** Requisição web padrão — antes era o contexto do Hono. */
	request: Request;
};

/**
 * Repositórios criados uma vez por processo, não por requisição: a conexão do
 * Drizzle já é um pool, e recriar os adaptadores a cada chamada só produziria
 * lixo.
 */
let repositorios: CatalogRepositories | undefined;

function getRepositorios(): CatalogRepositories {
	repositorios ??= repositoriosDrizzle(getDb());
	return repositorios;
}

export async function createContext({ request }: CreateContextOptions) {
	const session = await getAuth().api.getSession({
		headers: request.headers,
	});

	return { session, repos: getRepositorios() };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
