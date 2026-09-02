import { Link } from "@tanstack/react-router";
import { PhotoFrame } from "@/components/ui/photo-frame";
import type { Recipe } from "@/data/recipes";

interface RecipeCardProps {
	recipe: Recipe;
}

/** Recipe teaser used on both the home page and the recipe index. */
export function RecipeCard({ recipe }: RecipeCardProps) {
	return (
		<article className="h-full">
			<Link
				to="/receitas/$slug"
				params={{ slug: recipe.slug }}
				className="flex h-full flex-col overflow-hidden rounded-md border border-brand/12 bg-cream-raised shadow-[0_6px_18px_rgba(43,33,28,0.07)] transition-shadow hover:shadow-[0_14px_30px_rgba(43,33,28,0.18)]"
			>
				<div className="h-44">
					<PhotoFrame src={recipe.image} alt={recipe.name} hint={recipe.name} />
				</div>
				<div className="px-4 pt-3.5 pb-4">
					<h3 className="font-sans font-semibold text-[0.9375rem] text-ink leading-snug">
						{recipe.name}
					</h3>
					<p className="mt-2.5 flex items-center gap-2.5 font-sans text-ink-faint text-xs">
						{recipe.time}
						<span aria-hidden="true" className="text-ink-sand">
							•
						</span>
						{recipe.level}
					</p>
				</div>
			</Link>
		</article>
	);
}
