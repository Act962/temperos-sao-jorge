import { createFileRoute } from "@tanstack/react-router";
import { ProductCatalog } from "@/components/products/product-catalog";
import { PRODUCTS } from "@/data/products";
import { buildPageSeo } from "@/lib/seo";
import {
	breadcrumbSchema,
	jsonLdScript,
	productListSchema,
} from "@/lib/structured-data";

const DESCRIPTION =
	"Conheça o catálogo completo da São Jorge Alimentos: temperos em pó e líquidos, chás, ervas e especiarias, molhos, farinhas naturais, sementes e grãos.";

export const Route = createFileRoute("/produtos/")({
	head: () => {
		const seo = buildPageSeo({
			title: "Nossos produtos",
			description: DESCRIPTION,
			path: "/produtos",
		});
		return {
			meta: seo.meta,
			links: seo.links,
			scripts: [
				jsonLdScript(
					breadcrumbSchema([
						{ name: "Início", path: "/" },
						{ name: "Produtos", path: "/produtos" },
					]),
				),
				jsonLdScript(productListSchema(PRODUCTS, "/produtos")),
			],
		};
	},
	component: ProductsPage,
});

function ProductsPage() {
	return (
		<ProductCatalog
			title="Nossos produtos"
			description="Qualidade, sabor e variedade para o seu dia a dia."
			products={PRODUCTS}
			activeFamilySlug={null}
		/>
	);
}
