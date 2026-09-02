import { RecipeCard } from "@/components/recipes/recipe-card";
import { BrandLink } from "@/components/ui/brand-button";
import { Reveal } from "@/components/ui/reveal";
import { Eyebrow, SectionHeading } from "@/components/ui/section-heading";
import { RECIPES } from "@/data/recipes";

const PREVIEW_COUNT = 3;

/** Three-recipe teaser that sits between the product band and the values bar. */
export function RecipesPreviewSection() {
	const recipes = RECIPES.slice(0, PREVIEW_COUNT);

	return (
		<section className="bg-cream pt-21">
			<div className="shell grid items-start gap-14 lg:grid-cols-[0.72fr_2fr]">
				<div>
					<Eyebrow className="mb-3.5">Receitas</Eyebrow>
					<Reveal>
						<SectionHeading className="text-[2.5rem]">
							Sabor que inspira
						</SectionHeading>
					</Reveal>
					<p className="mt-4.5 font-sans text-[0.9375rem] text-ink-muted leading-[1.65]">
						Receitas práticas, deliciosas e feitas para momentos especiais.
					</p>
					<BrandLink
						to="/receitas"
						variant="outline"
						size="sm"
						className="mt-6.5"
					>
						Ver todas as receitas
					</BrandLink>
				</div>

				<ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
					{recipes.map((recipe, index) => (
						<Reveal
							as="li"
							key={recipe.slug}
							delay={index * 110}
							className="h-full"
						>
							<RecipeCard recipe={recipe} />
						</Reveal>
					))}
				</ul>
			</div>
		</section>
	);
}
