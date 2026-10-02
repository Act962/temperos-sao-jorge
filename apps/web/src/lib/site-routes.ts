import type { Catalog } from "@/lib/catalog";

/**
 * Every indexable URL on the site, in one place. The sitemap is generated from
 * this list, so a new page is discoverable the moment it is registered here.
 */

export interface SiteRoute {
	readonly path: string;
	/** sitemap changefreq hint. */
	readonly changeFrequency: "daily" | "weekly" | "monthly" | "yearly";
	/** sitemap priority, 0.0 - 1.0. */
	readonly priority: number;
}

const STATIC_ROUTES: readonly SiteRoute[] = [
	{ path: "/", changeFrequency: "weekly", priority: 1 },
	{ path: "/produtos", changeFrequency: "weekly", priority: 0.9 },
	{ path: "/receitas", changeFrequency: "weekly", priority: 0.8 },
	{ path: "/sobre", changeFrequency: "yearly", priority: 0.6 },
	{ path: "/contato", changeFrequency: "yearly", priority: 0.6 },
	{ path: "/privacidade", changeFrequency: "yearly", priority: 0.2 },
	{ path: "/cookies", changeFrequency: "yearly", priority: 0.2 },
];

/**
 * Recebe o catálogo em vez de importá-lo: uma receita criada no painel entra
 * no sitemap na leitura seguinte, sem novo build.
 */
export function getSiteRoutes(
	catalog: Pick<Catalog, "families" | "recipes">,
): readonly SiteRoute[] {
	return [
		...STATIC_ROUTES,
		...catalog.families.map<SiteRoute>((family) => ({
			path: `/produtos/${family.slug}`,
			changeFrequency: "weekly",
			priority: 0.8,
		})),
		...catalog.recipes.map<SiteRoute>((recipe) => ({
			path: `/receitas/${recipe.slug}`,
			changeFrequency: "monthly",
			priority: 0.7,
		})),
	];
}
