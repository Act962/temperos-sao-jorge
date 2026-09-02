import { cn } from "@my-better-t-app/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { PRODUCT_FAMILIES } from "@/data/products";

interface FamilyFilterProps {
	/** Slug of the family being shown, or null on the "Todos" listing. */
	activeSlug: string | null;
}

/**
 * `inline-flex` é obrigatório aqui: num link inline o padding vertical
 * transborda a caixa de linha, o `li` mede menos que o chip e o gap entre as
 * linhas some — as duas fileiras encostam uma na outra.
 */
const CHIP_BASE =
	"inline-flex items-center rounded-full border border-brand/28 px-4.5 py-2 font-sans text-[0.8125rem] font-semibold leading-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-bright";
const CHIP_INACTIVE = "bg-transparent text-[#6b564c] hover:bg-brand/8";
const CHIP_ACTIVE = "bg-brand text-cream-fg";

/**
 * Family filter rendered as real links rather than buttons: every family is a
 * crawlable, shareable URL of its own instead of client-side state.
 */
export function FamilyFilter({ activeSlug }: FamilyFilterProps) {
	return (
		<nav aria-label="Filtrar por família de produtos">
			<ul className="flex flex-wrap justify-center gap-x-2.5 gap-y-3">
				<li>
					<Link
						to="/produtos"
						aria-current={activeSlug === null ? "page" : undefined}
						className={cn(
							CHIP_BASE,
							activeSlug === null ? CHIP_ACTIVE : CHIP_INACTIVE,
						)}
					>
						Todos
					</Link>
				</li>
				{PRODUCT_FAMILIES.map((family) => {
					const active = family.slug === activeSlug;
					return (
						<li key={family.slug}>
							<Link
								to="/produtos/$familia"
								params={{ familia: family.slug }}
								aria-current={active ? "page" : undefined}
								className={cn(CHIP_BASE, active ? CHIP_ACTIVE : CHIP_INACTIVE)}
							>
								{family.name}
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
