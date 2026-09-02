import { describe, expect, it } from "vitest";
import { PRODUCT_FAMILIES } from "@/data/products";
import { RECIPES } from "@/data/recipes";
import { getSiteRoutes } from "@/lib/site-routes";

describe("registro de rotas do sitemap", () => {
	const routes = getSiteRoutes();
	const paths = routes.map((route) => route.path);

	it("inclui uma URL por família", () => {
		// O sitemap é gerado daqui: família que não entra nesta lista some da
		// submissão ao Google mesmo existindo no site.
		for (const family of PRODUCT_FAMILIES) {
			expect(paths).toContain(`/produtos/${family.slug}`);
		}
	});

	it("inclui uma URL por receita", () => {
		for (const recipe of RECIPES) {
			expect(paths).toContain(`/receitas/${recipe.slug}`);
		}
	});

	it("cobre as páginas fixas", () => {
		for (const path of [
			"/",
			"/produtos",
			"/receitas",
			"/sobre",
			"/contato",
			"/privacidade",
			"/cookies",
		]) {
			expect(paths).toContain(path);
		}
	});

	it("não repete caminho", () => {
		expect(new Set(paths).size).toBe(paths.length);
	});

	it("mantém prioridade entre 0 e 1 e a home no topo", () => {
		for (const route of routes) {
			expect(route.priority).toBeGreaterThan(0);
			expect(route.priority).toBeLessThanOrEqual(1);
		}
		expect(routes.find((r) => r.path === "/")?.priority).toBe(1);
	});

	it("declara todo caminho começando por barra", () => {
		for (const path of paths) {
			expect(path.startsWith("/")).toBe(true);
		}
	});
});
