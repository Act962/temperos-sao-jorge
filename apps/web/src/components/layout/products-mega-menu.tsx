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
 * Painel de produtos, só no desktop: famílias à esquerda, produtos da família
 * sob o cursor à direita. Fica inerte enquanto fechado para o leitor de tela
 * não percorrer 105 links invisíveis.
 *
 * A lista de produtos não rola: rolagem dentro de um painel aberto por hover é
 * ruim de operar, porque o painel fecha assim que o ponteiro escapa. O painel
 * cresce até caber a maior família — 26 chás em duas colunas. O limite de
 * altura abaixo é só rede de segurança para telas muito baixas, e aí a barra
 * sai discreta em vez da nativa clara sobre o vermelho.
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
				"absolute top-full left-1/2 z-80 w-185 -translate-x-1/2 pt-3.5 transition-[opacity,transform] duration-200",
				open
					? "visible translate-y-0 opacity-100"
					: "invisible -translate-y-2 opacity-0",
			)}
		>
			<div className="relative grid grid-cols-[15.5rem_1fr] overflow-hidden rounded-b-xl bg-brand shadow-[0_26px_60px_rgba(43,10,10,0.4)]">
				<nav aria-label="Famílias de produtos" className="bg-brand-dark py-2.5">
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
									"flex w-full items-center gap-2.5 px-5.5 py-2.5 text-left font-sans font-semibold text-cream-fg text-sm tracking-[0.02em] transition-colors",
									active ? "bg-brand" : "hover:bg-brand/60",
								)}
							>
								<span className="flex-1">{item.name}</span>
								<span
									className={cn(
										"font-normal text-xs tabular-nums transition-opacity",
										active ? "opacity-70" : "opacity-45",
									)}
								>
									{item.count}
								</span>
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
				</nav>

				<div className="flex flex-col px-7 pt-5 pb-5.5">
					<p className="mb-4 font-bold font-sans text-brand-rose text-xs uppercase tracking-[0.16em]">
						{family.name}
					</p>
					<ul className="scrollbar-brand grid max-h-[min(58vh,27rem)] grid-cols-2 gap-x-7 overflow-y-auto">
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
						className="mt-5 inline-flex w-fit rounded-[5px] bg-cream-fg px-4.5 py-2.5 font-sans font-semibold text-[0.8125rem] text-brand transition-colors hover:bg-white"
					>
						Ver os {family.count} produtos
					</Link>
				</div>
			</div>
		</div>
	);
}
