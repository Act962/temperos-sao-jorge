import { describe, expect, it } from "vitest";
import { PRODUCTS } from "@/data/products";
import { filterRecipes, getRecipeBySlug, RECIPES } from "@/data/recipes";

describe("receitas", () => {
	it("não repete slug", () => {
		const slugs = RECIPES.map((recipe) => recipe.slug);
		expect(new Set(slugs).size).toBe(slugs.length);
	});

	it("referencia apenas produtos que existem no catálogo", () => {
		// A página da receita monta "Produtos utilizados" a partir daqui; um slug
		// errado some da lista silenciosamente, sem erro nenhum.
		const known = new Set(PRODUCTS.map((product) => product.slug));
		const missing = RECIPES.flatMap((recipe) =>
			recipe.usedProductSlugs
				.filter((slug) => !known.has(slug))
				.map((slug) => `${recipe.slug} → ${slug}`),
		);
		expect(missing).toEqual([]);
	});

	it("mantém `minutes` coerente com o tempo exibido", () => {
		// `time` é o que o visitante lê; `minutes` é o que decide os filtros de
		// duração. Divergir faz a receita cair no balde errado.
		for (const recipe of RECIPES) {
			const hours = /(\d+)\s*h/.exec(recipe.time);
			const mins = /(\d+)\s*min/.exec(recipe.time);
			const expected =
				(hours ? Number(hours[1]) * 60 : 0) + (mins ? Number(mins[1]) : 0);
			expect(recipe.minutes).toBe(expected);
		}
	});

	it("declara ingredientes e preparo em toda receita", () => {
		for (const recipe of RECIPES) {
			expect(recipe.ingredients.length).toBeGreaterThan(0);
			expect(recipe.steps.length).toBeGreaterThan(0);
			expect(recipe.servings).toBeGreaterThan(0);
		}
	});

	describe("filtros", () => {
		it('"Todas" devolve tudo', () => {
			expect(filterRecipes(RECIPES, "Todas")).toHaveLength(RECIPES.length);
		});

		it("separa por duração sem sobreposição nem buraco", () => {
			const rapidas = filterRecipes(RECIPES, "Até 30 min");
			const longas = filterRecipes(RECIPES, "+ 30 min");

			expect(rapidas.every((r) => r.minutes <= 30)).toBe(true);
			expect(longas.every((r) => r.minutes > 30)).toBe(true);
			expect(rapidas.length + longas.length).toBe(RECIPES.length);
		});

		it("filtra por categoria", () => {
			const almoco = filterRecipes(RECIPES, "Almoço");
			expect(almoco.length).toBeGreaterThan(0);
			expect(almoco.every((r) => r.category === "Almoço")).toBe(true);
		});
	});

	it("resolve por slug e devolve undefined para slug inexistente", () => {
		expect(getRecipeBySlug(RECIPES[0].slug)?.name).toBe(RECIPES[0].name);
		expect(getRecipeBySlug("nao-existe")).toBeUndefined();
	});
});
