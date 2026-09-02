import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { RecipeGrid } from "@/components/recipes/recipe-grid";
import { FilterChips } from "@/components/ui/filter-chips";
import { PageHeader } from "@/components/ui/page-header";
import {
	filterRecipes,
	RECIPE_FILTERS,
	RECIPES,
	type RecipeFilter,
} from "@/data/recipes";
import { buildPageSeo } from "@/lib/seo";
import {
	breadcrumbSchema,
	jsonLdScript,
	recipeListSchema,
} from "@/lib/structured-data";

const DESCRIPTION =
	"Receitas práticas e saborosas para o almoço, o jantar e os momentos especiais, feitas com os temperos São Jorge Alimentos.";

const FILTER_OPTIONS = RECIPE_FILTERS.map((filter) => ({
	value: filter,
	label: filter,
}));

export const Route = createFileRoute("/receitas/")({
	head: () => {
		const seo = buildPageSeo({
			title: "Receitas",
			description: DESCRIPTION,
			path: "/receitas",
		});
		return {
			meta: seo.meta,
			links: seo.links,
			scripts: [
				jsonLdScript(
					breadcrumbSchema([
						{ name: "Início", path: "/" },
						{ name: "Receitas", path: "/receitas" },
					]),
				),
				jsonLdScript(recipeListSchema(RECIPES, "/receitas")),
			],
		};
	},
	component: RecipesPage,
});

function RecipesPage() {
	const [filter, setFilter] = useState<RecipeFilter>("Todas");
	const recipes = filterRecipes(RECIPES, filter);

	return (
		<div className="bg-cream pt-16 pb-24">
			<div className="shell-narrow">
				<PageHeader
					title="Receitas"
					description="Encontre a receita perfeita para cada momento."
				/>

				<div className="mt-8.5 mb-10">
					<FilterChips
						label="Filtrar receitas"
						options={FILTER_OPTIONS}
						value={filter}
						onChange={setFilter}
					/>
				</div>

				<RecipeGrid recipes={recipes} />
			</div>
		</div>
	);
}
