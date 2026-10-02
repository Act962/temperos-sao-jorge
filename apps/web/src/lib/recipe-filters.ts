import type { Recipe } from "@/data/recipes";

/**
 * Filtros da página de receitas.
 *
 * Moram fora de `src/data/recipes.ts` porque aquele arquivo carrega as
 * receitas em si: importar uma função de lá levaria o retrato inteiro para o
 * bundle do navegador, e a lista que o site mostra vem do banco.
 */
export const RECIPE_FILTERS = [
	"Todas",
	"Almoço",
	"Jantar",
	"Lanches",
	"Festas",
	"Até 30 min",
	"+ 30 min",
] as const;

export type RecipeFilter = (typeof RECIPE_FILTERS)[number];

export function filterRecipes(
	recipes: readonly Recipe[],
	filter: RecipeFilter,
): readonly Recipe[] {
	if (filter === "Todas") return recipes;
	if (filter === "Até 30 min")
		return recipes.filter((recipe) => recipe.minutes <= 30);
	if (filter === "+ 30 min")
		return recipes.filter((recipe) => recipe.minutes > 30);
	return recipes.filter((recipe) => recipe.category === filter);
}
