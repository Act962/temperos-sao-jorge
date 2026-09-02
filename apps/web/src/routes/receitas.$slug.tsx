import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PhotoFrame } from "@/components/ui/photo-frame";
import { ProductImage } from "@/components/ui/product-image";
import { PRODUCTS } from "@/data/products";
import { getRecipeBySlug } from "@/data/recipes";
import { buildPageSeo } from "@/lib/seo";
import {
	breadcrumbSchema,
	jsonLdScript,
	recipeSchema,
} from "@/lib/structured-data";

export const Route = createFileRoute("/receitas/$slug")({
	loader: ({ params }) => {
		const recipe = getRecipeBySlug(params.slug);
		if (!recipe) throw notFound();
		const usedProducts = recipe.usedProductSlugs.flatMap((slug) => {
			const product = PRODUCTS.find((item) => item.slug === slug);
			return product ? [product] : [];
		});
		return { recipe, usedProducts };
	},

	head: ({ loaderData }) => {
		if (!loaderData) return {};
		const { recipe } = loaderData;
		const path = `/receitas/${recipe.slug}`;
		const seo = buildPageSeo({
			title: recipe.name,
			description: recipe.summary,
			path,
			image: recipe.image,
			type: "article",
		});
		return {
			meta: seo.meta,
			links: seo.links,
			scripts: [
				jsonLdScript(
					breadcrumbSchema([
						{ name: "Início", path: "/" },
						{ name: "Receitas", path: "/receitas" },
						{ name: recipe.name, path },
					]),
				),
				jsonLdScript(recipeSchema(recipe)),
			],
		};
	},

	notFoundComponent: () => (
		<div className="bg-cream py-28 text-center">
			<p className="font-sans text-ink-muted">Receita não encontrada.</p>
			<Link
				to="/receitas"
				className="mt-4 inline-block font-sans text-brand text-sm underline"
			>
				Ver todas as receitas
			</Link>
		</div>
	),

	component: RecipePage,
});

function RecipePage() {
	const { recipe, usedProducts } = Route.useLoaderData();

	return (
		<article className="bg-cream pt-13 pb-24">
			<div className="shell-narrow">
				<Link
					to="/receitas"
					className="mb-6.5 inline-flex items-center gap-2 font-medium font-sans text-brand text-sm transition-colors hover:text-brand-hover"
				>
					<ArrowLeft aria-hidden="true" className="size-4" />
					Todas as receitas
				</Link>

				<header className="grid items-start gap-11 lg:grid-cols-[1fr_1.05fr]">
					<div>
						<h1 className="font-display font-extrabold text-[2.25rem] text-ink uppercase leading-[1.05] sm:text-[2.5rem]">
							{recipe.name}
						</h1>
						<p className="mt-3.5 flex flex-wrap items-center gap-2.5 font-sans text-[0.8125rem] text-ink-faint">
							{recipe.time}
							<span aria-hidden="true" className="text-ink-sand">
								•
							</span>
							{recipe.level}
							<span aria-hidden="true" className="text-ink-sand">
								•
							</span>
							{recipe.servings} porções
						</p>
						<p className="mt-4 max-w-prose text-pretty font-sans text-base text-ink-muted leading-relaxed">
							{recipe.summary}
						</p>
					</div>

					<div className="h-75 overflow-hidden rounded-lg">
						<PhotoFrame
							src={recipe.image}
							alt={`${recipe.name} finalizado e servido`}
							hint="Foto do prato finalizado"
							loading="eager"
							fetchPriority="high"
						/>
					</div>
				</header>

				<div className="mt-13 grid items-start gap-13 lg:grid-cols-[0.85fr_1.15fr]">
					<section aria-labelledby="ingredientes">
						<h2
							id="ingredientes"
							className="mb-4 font-bold font-sans text-[0.9375rem] text-brand-bright uppercase tracking-[0.14em]"
						>
							Ingredientes
						</h2>
						<ul className="flex flex-col gap-2.75">
							{recipe.ingredients.map((ingredient) => (
								<li
									key={ingredient}
									className="border-brand/25 border-l-2 pl-4 font-sans text-[0.9375rem] text-ink-soft leading-relaxed"
								>
									{ingredient}
								</li>
							))}
						</ul>
					</section>

					<section aria-labelledby="modo-de-preparo">
						<h2
							id="modo-de-preparo"
							className="mb-4 font-bold font-sans text-[0.9375rem] text-brand-bright uppercase tracking-[0.14em]"
						>
							Modo de preparo
						</h2>
						<ol className="flex list-decimal flex-col gap-3.5 pl-5.5">
							{recipe.steps.map((step) => (
								<li
									key={step.slice(0, 40)}
									className="font-sans text-[0.9375rem] text-ink-soft leading-[1.65]"
								>
									{step}
								</li>
							))}
						</ol>
					</section>
				</div>

				{usedProducts.length > 0 ? (
					<section aria-labelledby="produtos-utilizados" className="mt-14">
						<h2
							id="produtos-utilizados"
							className="mb-4.5 font-bold font-sans text-[0.9375rem] text-brand-bright uppercase tracking-[0.14em]"
						>
							Produtos utilizados
						</h2>
						<ul className="grid grid-cols-2 gap-4.5 lg:grid-cols-4">
							{usedProducts.map((product) => (
								<li key={product.slug}>
									<Link
										to="/produtos/$familia"
										params={{ familia: product.familySlug }}
										className="block rounded-lg border border-brand/12 bg-cream-raised p-3.5 text-center transition-shadow hover:shadow-[0_12px_26px_rgba(43,33,28,0.13)]"
									>
										<div className="h-27.5">
											<ProductImage src={product.image} alt={product.name} />
										</div>
										<p className="mt-2.5 font-sans font-semibold text-[0.8125rem] text-ink">
											{product.name}
										</p>
									</Link>
								</li>
							))}
						</ul>
					</section>
				) : null}
			</div>
		</article>
	);
}
