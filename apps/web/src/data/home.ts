import { PRODUCT_FAMILIES, PRODUCTS } from "@/data/products";

/**
 * The four families the home page showcases, each represented by one packshot.
 * Mirrors the selection made on the approved design canvas.
 */
const FEATURED = [
	{ familySlug: "chas", productSlug: "camomila" },
	{ familySlug: "temperos-em-po", productSlug: "paprica-doce" },
	{
		familySlug: "molhos-e-pastas",
		productSlug: "molho-de-alho-jorge-batista-500-ml",
	},
	{
		familySlug: "temperos-liquidos-prontos",
		productSlug: "tempero-tradicional-500-ml",
	},
] as const;

export interface FeaturedFamily {
	readonly slug: string;
	readonly name: string;
	readonly image: string;
	readonly imageAlt: string;
}

export const FEATURED_FAMILIES: readonly FeaturedFamily[] = FEATURED.flatMap(
	(entry) => {
		const family = PRODUCT_FAMILIES.find(
			(item) => item.slug === entry.familySlug,
		);
		const product = PRODUCTS.find((item) => item.slug === entry.productSlug);
		if (!family || !product) return [];
		return [
			{
				slug: family.slug,
				name: family.name,
				image: product.image,
				imageAlt: `${product.name} — linha ${family.name} da São Jorge Alimentos`,
			},
		];
	},
);
