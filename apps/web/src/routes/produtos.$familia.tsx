import { createFileRoute, notFound } from "@tanstack/react-router";
import { ProductCatalog } from "@/components/products/product-catalog";
import { getFamilyBySlug, getProductsByFamily } from "@/data/products";
import { buildPageSeo } from "@/lib/seo";
import {
	breadcrumbSchema,
	jsonLdScript,
	productListSchema,
} from "@/lib/structured-data";

function familyDescription(name: string, count: number): string {
	return `Linha de ${name} da São Jorge Alimentos: ${count} produtos selecionados para dar mais sabor ao seu dia a dia.`;
}

export const Route = createFileRoute("/produtos/$familia")({
	loader: ({ params }) => {
		const family = getFamilyBySlug(params.familia);
		if (!family) throw notFound();
		return { family, products: getProductsByFamily(family.slug) };
	},

	head: ({ loaderData }) => {
		if (!loaderData) return {};
		const { family, products } = loaderData;
		const path = `/produtos/${family.slug}`;
		const seo = buildPageSeo({
			title: family.name,
			description: familyDescription(family.name, family.count),
			path,
			image: products[0]?.image,
		});
		return {
			meta: seo.meta,
			links: seo.links,
			scripts: [
				jsonLdScript(
					breadcrumbSchema([
						{ name: "Início", path: "/" },
						{ name: "Produtos", path: "/produtos" },
						{ name: family.name, path },
					]),
				),
				jsonLdScript(productListSchema(products, path)),
			],
		};
	},

	notFoundComponent: () => (
		<div className="bg-cream py-28 text-center">
			<p className="font-sans text-ink-muted">
				Família de produtos não encontrada.
			</p>
		</div>
	),

	component: ProductFamilyPage,
});

function ProductFamilyPage() {
	const { family, products } = Route.useLoaderData();

	return (
		<ProductCatalog
			title={family.name}
			description={familyDescription(family.name, family.count)}
			products={products}
			activeFamilySlug={family.slug}
		/>
	);
}
