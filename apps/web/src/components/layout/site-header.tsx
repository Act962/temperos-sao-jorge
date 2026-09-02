import { cn } from "@my-better-t-app/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { ProductsMegaMenu } from "@/components/layout/products-mega-menu";
import { BrandLink } from "@/components/ui/brand-button";
import { PRODUCT_FAMILIES } from "@/data/products";

const NAV_LINKS = [
	{ label: "Sobre", to: "/sobre" },
	{ label: "Receitas", to: "/receitas" },
	{ label: "Contato", to: "/contato" },
] as const;

/** Sticky site header: brand mark, primary navigation and the contact CTA. */
export function SiteHeader() {
	const [megaMenuOpen, setMegaMenuOpen] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);
	const mobileNavId = useId();

	// Never leave the mobile drawer open behind a locked body scroll.
	useEffect(() => {
		if (!mobileOpen) return;
		const previous = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = previous;
		};
	}, [mobileOpen]);

	// Escape closes whichever navigation surface is open.
	useEffect(() => {
		if (!mobileOpen && !megaMenuOpen) return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "Escape") return;
			setMobileOpen(false);
			setMegaMenuOpen(false);
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [mobileOpen, megaMenuOpen]);

	const closeAll = () => {
		setMegaMenuOpen(false);
		setMobileOpen(false);
	};

	return (
		<header className="sticky top-0 z-60 border-brand border-t-[5px] bg-cream-raised shadow-[0_1px_0_rgba(140,20,20,0.12)]">
			<div className="shell flex items-center justify-between gap-7 py-3">
				<Link to="/" onClick={closeAll} aria-label={"Ir para a página inicial"}>
					<BrandLogo className="h-9 md:h-[52px]" />
				</Link>

				<nav
					aria-label="Navegação principal"
					className="hidden items-center gap-8 lg:flex"
				>
					<Link
						to="/sobre"
						className="py-1 font-medium font-sans text-[0.9375rem] text-ink-soft transition-colors hover:text-brand [&.active]:text-brand"
					>
						Sobre
					</Link>

					{/* Hover opens the panel; focus does the same so it is reachable
					    by keyboard, and blur outside the subtree closes it again.
					    biome-ignore lint/a11y/noStaticElementInteractions: the wrapper
					    is a positioning container — the interactive affordances are the
					    link and the panel it owns, both keyboard-operable. */}
					<div
						className="relative"
						onMouseEnter={() => setMegaMenuOpen(true)}
						onMouseLeave={() => setMegaMenuOpen(false)}
						onFocus={() => setMegaMenuOpen(true)}
						onBlur={(event) => {
							if (!event.currentTarget.contains(event.relatedTarget)) {
								setMegaMenuOpen(false);
							}
						}}
					>
						<Link
							to="/produtos"
							aria-expanded={megaMenuOpen}
							onClick={() => setMegaMenuOpen(false)}
							className={cn(
								"flex items-center gap-[7px] py-1 font-medium font-sans text-[0.9375rem] transition-colors [&.active]:text-brand",
								megaMenuOpen ? "text-brand" : "text-ink-soft hover:text-brand",
							)}
						>
							Produtos
							<ChevronDown
								aria-hidden="true"
								className={cn(
									"size-3 transition-transform duration-250",
									megaMenuOpen && "rotate-180",
								)}
							/>
						</Link>
						<ProductsMegaMenu open={megaMenuOpen} onNavigate={closeAll} />
					</div>

					{NAV_LINKS.slice(1).map((link) => (
						<Link
							key={link.to}
							to={link.to}
							className="py-1 font-medium font-sans text-[0.9375rem] text-ink-soft transition-colors hover:text-brand [&.active]:text-brand"
						>
							{link.label}
						</Link>
					))}
				</nav>

				<div className="flex items-center gap-3">
					<BrandLink to="/contato" size="sm" className="hidden sm:inline-flex">
						Fale conosco
					</BrandLink>

					<button
						type="button"
						aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
						aria-expanded={mobileOpen}
						aria-controls={mobileNavId}
						onClick={() => setMobileOpen((open) => !open)}
						className="inline-flex size-10 items-center justify-center rounded-[4px] text-brand transition-colors hover:bg-brand/10 lg:hidden"
					>
						{mobileOpen ? (
							<X aria-hidden="true" />
						) : (
							<Menu aria-hidden="true" />
						)}
					</button>
				</div>
			</div>

			<div
				id={mobileNavId}
				hidden={!mobileOpen}
				className="max-h-[calc(100svh-5rem)] overflow-y-auto border-brand/12 border-t bg-cream-raised lg:hidden"
			>
				<nav
					aria-label="Navegação principal (móvel)"
					className="shell flex flex-col py-4"
				>
					<Link
						to="/sobre"
						onClick={closeAll}
						className="border-brand/10 border-b py-3 font-medium font-sans text-ink-soft"
					>
						Sobre
					</Link>
					<Link
						to="/produtos"
						onClick={closeAll}
						className="py-3 font-medium font-sans text-ink-soft"
					>
						Produtos
					</Link>
					<ul className="mb-2 flex flex-col border-brand/10 border-b pb-3 pl-3">
						{PRODUCT_FAMILIES.map((family) => (
							<li key={family.slug}>
								<Link
									to="/produtos/$familia"
									params={{ familia: family.slug }}
									onClick={closeAll}
									className="block py-2 font-sans text-ink-muted text-sm"
								>
									{family.name}
								</Link>
							</li>
						))}
					</ul>
					<Link
						to="/receitas"
						onClick={closeAll}
						className="border-brand/10 border-b py-3 font-medium font-sans text-ink-soft"
					>
						Receitas
					</Link>
					<Link
						to="/contato"
						onClick={closeAll}
						className="py-3 font-medium font-sans text-ink-soft"
					>
						Contato
					</Link>
					<BrandLink
						to="/contato"
						onClick={closeAll}
						className="mt-3 sm:hidden"
					>
						Fale conosco
					</BrandLink>
				</nav>
			</div>
		</header>
	);
}
