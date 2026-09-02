import { ProductImage } from "@/components/ui/product-image";
import type { Product } from "@/data/products";

interface ProductCardProps {
	product: Product;
	/** The first visible row loads eagerly to keep the grid from popping in. */
	eager?: boolean;
}

/** Single packshot tile in the product grid. */
export function ProductCard({ product, eager = false }: ProductCardProps) {
	return (
		<article className="h-full rounded-lg border border-brand/12 bg-cream-raised px-4 pt-4 pb-4.5 text-center shadow-[0_4px_14px_rgba(43,33,28,0.06)] transition-shadow hover:shadow-[0_12px_26px_rgba(43,33,28,0.13)]">
			<div className="mb-3 h-37.5">
				<ProductImage
					src={product.image}
					alt={`${product.name} — ${product.family} São Jorge Alimentos`}
					loading={eager ? "eager" : "lazy"}
				/>
			</div>
			<h3 className="font-sans font-semibold text-ink text-sm leading-snug">
				{product.name}
			</h3>
			<p className="mt-1 font-sans text-ink-faint text-xs">{product.family}</p>
		</article>
	);
}
