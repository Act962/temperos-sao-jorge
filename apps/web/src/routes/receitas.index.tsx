import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { RecipeGrid } from "@/components/recipes/recipe-grid";
import { FilterChips } from "@/components/ui/filter-chips";
import { PageHeader } from "@/components/ui/page-header";
import { catalogQuery, useCatalog } from "@/lib/catalog";
import {
	filterRecipes,
	RECIPE_FILTERS,
	type RecipeFilter,
} from "@/lib/recipe-filters";
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
	loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),

	head: ({ loaderData }) => {
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
				jsonLdScript(recipeListSchema(loaderData?.recipes ?? [], "/receitas")),
			],
		};
	},
	component: RecipesPage,
});

function RecipesPage() {
	const [filter, setFilter] = useState<RecipeFilter>("Todas");
	const recipes = filterRecipes(useCatalog().recipes, filter);

	return (
		<div className="bg-cream pt-16 pb-24">
			<div className="shell-narrow">
				<PageHeader
					title="Receitas"
					description="Encontre a receita perfeita para cada momento."
				/>

				<div className="mt-11 mb-12">
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
