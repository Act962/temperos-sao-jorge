import type { CatalogRepositories } from "@my-better-t-app/core";
import { getDb } from "@my-better-t-app/db";
import { repositoriosDrizzle } from "@my-better-t-app/db/repositories/catalog";

/**
 * Repositórios criados uma vez por processo, não por requisição: a conexão do
 * Drizzle já é um pool, e recriar os adaptadores a cada chamada só produziria
 * lixo.
 *
 * Módulo próprio porque dois caminhos chegam aqui: o contexto do tRPC, que
 * também abre a sessão, e a leitura pública do catálogo, que não tem sessão
 * nenhuma e não deve carregar a autenticação só para listar produtos.
 */
let repositorios: CatalogRepositories | undefined;

export function getRepositorios(): CatalogRepositories {
	repositorios ??= repositoriosDrizzle(getDb());
	return repositorios;
}
