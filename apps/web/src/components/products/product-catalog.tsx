import { FamilyFilter } from "@/components/products/family-filter";
import { ProductGrid } from "@/components/products/product-grid";
import { PageHeader } from "@/components/ui/page-header";
import type { Product } from "@/data/products";

interface ProductCatalogProps {
	title: string;
	description: string;
	products: readonly Product[];
	activeFamilySlug: string | null;
}

/** Page body shared by the full catalogue and every single-family listing. */
export function ProductCatalog({
	title,
	description,
	products,
	activeFamilySlug,
}: ProductCatalogProps) {
	return (
		<div className="bg-cream pt-16 pb-24">
			<div className="shell-narrow">
				<PageHeader title={title} description={description} />

				{/* Os filtros são um bloco de duas fileiras: precisam de mais ar dos
				    dois lados para não colar no texto acima nem na grade abaixo. */}
				<div className="mt-11">
					<FamilyFilter activeSlug={activeFamilySlug} />
				</div>

				<p className="sr-only" aria-live="polite">
					{products.length} produtos listados.
				</p>

				<div className="mt-12">
					<ProductGrid products={products} />
				</div>
			</div>
		</div>
	);
}
