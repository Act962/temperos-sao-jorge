import { PRODUCT_FAMILIES, PRODUCTS } from "@/data/products";

/**
 * As oito famílias na home, cada uma representada por um packshot.
 *
 * O canvas original destacava só quatro; as outras quatro só existiam dentro do
 * menu suspenso, sem nenhuma porta de entrada para quem não o abrisse.
 */
const REPRESENTATIVE_PRODUCT: Record<string, string> = {
	chas: "camomila",
	"ervas-e-especiarias": "oregano",
	"farinhas-naturais": "farinha-de-beterraba",
	institucional: "paprica-doce-1-kg",
	"molhos-e-pastas": "molho-de-alho-jorge-batista-500-ml",
	"sementes-e-graos-naturais": "semente-de-chia",
	"temperos-em-po": "paprica-doce",
	"temperos-liquidos-prontos": "tempero-tradicional-500-ml",
};

export interface FeaturedFamily {
	readonly slug: string;
	readonly name: string;
	readonly count: number;
	readonly image: string;
	readonly imageAlt: string;
}

export const FEATURED_FAMILIES: readonly FeaturedFamily[] =
	PRODUCT_FAMILIES.flatMap((family) => {
		const product = PRODUCTS.find(
			(item) => item.slug === REPRESENTATIVE_PRODUCT[family.slug],
		);
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
