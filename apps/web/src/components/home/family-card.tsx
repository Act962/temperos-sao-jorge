import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ProductImage } from "@/components/ui/product-image";
import type { FeaturedFamily } from "@/data/home";

interface FamilyCardProps {
	family: FeaturedFamily;
	/** Os primeiros cartões ficam visíveis de saída e carregam sem lazy. */
	eager?: boolean;
}

/** Cartão de família de produtos usado no carrossel da home. */
export function FamilyCard({ family, eager = false }: FamilyCardProps) {
	return (
		<Link
			to="/produtos/$familia"
			params={{ familia: family.slug }}
			className="group flex h-full flex-col overflow-hidden rounded-md bg-cream-raised shadow-[0_10px_26px_rgba(0,0,0,0.22)] transition-shadow hover:shadow-[0_18px_38px_rgba(0,0,0,0.34)]"
		>
			<div className="h-53 bg-cream-bright p-5">
				<ProductImage
					src={family.image}
					alt={family.imageAlt}
					loading={eager ? "eager" : "lazy"}
				/>
			</div>
			<div className="flex flex-1 flex-col px-4.5 pt-4 pb-4.5">
				<h3 className="font-sans font-semibold text-[1.0625rem] text-ink leading-snug">
					{family.name}
				</h3>
				<p className="mt-2 flex items-center gap-2 font-sans font-semibold text-[0.8125rem] text-brand-bright">
					{family.count} produtos
					<ArrowRight
						aria-hidden="true"
						className="size-4 transition-transform group-hover:translate-x-1"
					/>
				</p>
			</div>
		</Link>
	);
}
