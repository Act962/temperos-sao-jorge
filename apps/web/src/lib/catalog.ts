import type { CatalogoPublicado, SiteContent } from "@my-better-t-app/core";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import type { Product, ProductFamily } from "@/data/products";
import type { Recipe } from "@/data/recipes";

/**
 * O catálogo que o site exibe, lido do banco a cada visita.
 *
 * As rotas públicas pedem o catálogo por aqui, nunca importando os arquivos de
 * `src/data/` nem `packages/db`. O corpo da função de servidor não vai para o
 * bundle do navegador, e o que ela alcança — cache, banco, reserva — fica
 * atrás de um `import()` dinâmico. Veja `server/catalog.server.ts`.
 *
 * Os componentes continuam importando os **tipos** de `src/data/`: import de
 * tipo some na compilação e não arrasta os dados para o cliente.
 */
export interface Catalog {
	readonly families: readonly ProductFamily[];
	readonly products: readonly Product[];
	readonly recipes: readonly Recipe[];
	/** Configurações e textos das páginas. Veja `lib/site-content.ts`. */
	readonly content: SiteContent;
}

const fetchCatalog = createServerFn({ method: "GET" }).handler(
	async (): Promise<CatalogoPublicado> => {
		const { loadCatalog } = await import("@/server/catalog.server");
		return loadCatalog();
	},
);

export const catalogQuery = queryOptions({
	queryKey: ["catalog"],
	queryFn: (): Promise<Catalog> => fetchCatalog(),
});

/**
 * O catálogo dentro de um componente.
 *
 * A rota raiz garante o dado no `loader`, então isto nunca suspende na
 * primeira renderização — nem no servidor, onde o HTML precisa sair completo.
 */
export function useCatalog(): Catalog {
	return useSuspenseQuery(catalogQuery).data;
}

export function getFamilyBySlug(
	catalog: Catalog,
	slug: string,
): ProductFamily | undefined {
	return catalog.families.find((family) => family.slug === slug);
}

export function getProductsByFamily(
	catalog: Catalog,
	familySlug: string,
): readonly Product[] {
	return catalog.products.filter(
		(product) => product.familySlug === familySlug,
	);
}

export function getRecipeBySlug(
	catalog: Catalog,
	slug: string,
): Recipe | undefined {
	return catalog.recipes.find((recipe) => recipe.slug === slug);
}
