import { RecipeCard } from "@/components/recipes/recipe-card";
import type { Recipe } from "@/data/recipes";

interface RecipeGridProps {
	recipes: readonly Recipe[];
}

/** Responsive recipe grid with an empty state for filters that match nothing. */
export function RecipeGrid({ recipes }: RecipeGridProps) {
	if (recipes.length === 0) {
		return (
			<p className="py-10 text-center font-sans text-[0.9375rem] text-ink-faint">
				Nenhuma receita encontrada com esse filtro.
			</p>
		);
	}

	return (
		<ul className="grid gap-5.5 sm:grid-cols-2 lg:grid-cols-3">
			{recipes.map((recipe) => (
				<li key={recipe.slug} className="h-full">
					<RecipeCard recipe={recipe} />
				</li>
			))}
		</ul>
	);
}
