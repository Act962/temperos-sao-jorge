import type { Product, ProductFamily } from "@/data/products";

/**
 * As famílias na home, cada uma representada por um packshot.
 *
 * Qual produto representa cada família é escolhido no painel (Início) e chega
 * aqui por parâmetro.
 */

export interface FeaturedFamily {
	readonly slug: string;
	readonly name: string;
	readonly count: number;
	readonly image: string;
	readonly imageAlt: string;
}

/**
 * Recebe o catálogo em vez de importá-lo: as famílias e os produtos vêm do
 * banco a cada visita, e uma família criada no painel precisa aparecer aqui.
 *
 * Sem representante escolhido — família nova, ou produto que saiu do
 * catálogo — vale o primeiro produto da família. Antes a família sumia da
 * home em silêncio. Só fica de fora a família ainda sem produto nenhum.
 */
export function featuredFamilies(
	families: readonly ProductFamily[],
	products: readonly Product[],
	representatives: Readonly<Record<string, string>>,
): readonly FeaturedFamily[] {
	return families.flatMap((family) => {
		const daFamilia = products.filter(
			(item) => item.familySlug === family.slug,
		);
		const product =
			daFamilia.find((item) => item.slug === representatives[family.slug]) ??
			daFamilia[0];
		if (!product) return [];
		return [
			{
				slug: family.slug,
				name: family.name,
				count: family.count,
				image: product.image,
				imageAlt: `${product.name} — linha ${family.name} da São Jorge Alimentos`,
			},
		];
	});
}
