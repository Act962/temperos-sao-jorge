import { cn } from "@my-better-t-app/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { getProductsByFamily, PRODUCT_FAMILIES } from "@/data/products";

interface ProductsMegaMenuProps {
	open: boolean;
	/** Called when a link inside the panel is activated. */
	onNavigate: () => void;
}

/**
 * Desktop-only products panel: families on the left, the hovered family's
 * products on the right. Hidden from assistive tech while closed so screen
 * readers never walk 105 invisible links.
 */
export function ProductsMegaMenu({ open, onNavigate }: ProductsMegaMenuProps) {
	const [activeFamily, setActiveFamily] = useState(PRODUCT_FAMILIES[0].slug);
	const family =
		PRODUCT_FAMILIES.find((item) => item.slug === activeFamily) ??
		PRODUCT_FAMILIES[0];
	const products = getProductsByFamily(family.slug);

	return (
		<div
			inert={open ? undefined : true}
			className={cn(
				"absolute top-full left-1/2 z-80 w-[640px] -translate-x-1/2 pt-3.5 transition-[opacity,transform] duration-200",
				open
					? "visible translate-y-0 opacity-100"
					: "invisible -translate-y-2 opacity-0",
			)}
		>
			<div className="relative grid grid-cols-[232px_1fr] overflow-hidden rounded-b-xl bg-brand shadow-[0_26px_60px_rgba(43,10,10,0.4)]">
				<div className="bg-brand-dark py-2.5">
					{PRODUCT_FAMILIES.map((item) => {
						const active = item.slug === family.slug;
						return (
							<Link
								key={item.slug}
								to="/produtos/$familia"
								params={{ familia: item.slug }}
								onMouseEnter={() => setActiveFamily(item.slug)}
								onFocus={() => setActiveFamily(item.slug)}
								onClick={onNavigate}
								className={cn(
									"flex w-full items-center justify-between gap-2.5 px-[22px] py-3 text-left font-sans font-semibold text-cream-fg text-sm tracking-[0.02em] transition-colors",
									active ? "bg-brand" : "hover:bg-brand/60",
								)}
							>
								{item.name}
								<ChevronRight
									aria-hidden="true"
									className={cn(
										"size-3.5 shrink-0",
										active ? "opacity-100" : "opacity-40",
									)}
								/>
							</Link>
						);
					})}
				</div>

				<div className="px-6 pt-5 pb-[22px]">
					<p className="mb-3.5 font-bold font-sans text-brand-rose text-xs uppercase tracking-[0.16em]">
						{family.name}
					</p>
					<ul className="grid max-h-[300px] grid-cols-2 gap-x-5 gap-y-1.5 overflow-auto">
						{products.map((product) => (
							<li key={product.slug}>
								<Link
									to="/produtos/$familia"
									params={{ familia: family.slug }}
									onClick={onNavigate}
									className="block py-1.5 text-left font-sans text-[#f3e4d4] text-[0.84rem] leading-snug transition-colors hover:text-white"
								>
									{product.name}
								</Link>
							</li>
						))}
					</ul>
					<Link
						to="/produtos/$familia"
						params={{ familia: family.slug }}
						onClick={onNavigate}
						className="mt-4 inline-flex rounded-[5px] bg-cream-fg px-[18px] py-2.5 font-sans font-semibold text-[0.8125rem] text-brand transition-colors hover:bg-white"
					>
						Ver todos de {family.name}
					</Link>
				</div>
			</div>
		</div>
	);
}
