import { ProductCard } from "@/components/products/product-card";
import type { Product } from "@/data/products";

interface ProductGridProps {
	products: readonly Product[];
}

const EAGER_COUNT = 4;

/** Responsive packshot grid, with an empty state matching the design copy. */
export function ProductGrid({ products }: ProductGridProps) {
	if (products.length === 0) {
		return (
			<p className="py-10 text-center font-sans text-[0.9375rem] text-ink-faint">
				Nenhum produto encontrado nesta família.
			</p>
		);
	}

	return (
		<ul className="grid grid-cols-2 gap-5 lg:grid-cols-4">
			{products.map((product, index) => (
				<li key={product.slug} className="h-full">
					<ProductCard product={product} eager={index < EAGER_COUNT} />
				</li>
			))}
		</ul>
	);
}
