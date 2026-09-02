import { Button } from "@my-better-t-app/ui/components/button";
import { Separator } from "@my-better-t-app/ui/components/separator";
import { Link } from "@tanstack/react-router";
import { Boxes, CookingPot, LayoutDashboard, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/layout/brand-logo";

const NAV = [
	{ to: "/admin", label: "Visão geral", icon: LayoutDashboard, exact: true },
	{ to: "/admin/produtos", label: "Produtos", icon: Boxes, exact: false },
	{ to: "/admin/receitas", label: "Receitas", icon: CookingPot, exact: false },
] as const;

interface AdminShellProps {
	usuario: string;
	aoSair: () => void;
	children: ReactNode;
}

/** Moldura do painel: barra lateral fixa e área de conteúdo. */
export function AdminShell({ usuario, aoSair, children }: AdminShellProps) {
	return (
		<div className="min-h-svh bg-cream-sunken lg:grid lg:grid-cols-[16rem_1fr]">
			<aside className="flex flex-col gap-6 border-brand/12 border-b bg-cream-raised px-5 py-6 lg:sticky lg:top-0 lg:h-svh lg:border-r lg:border-b-0">
				<div className="flex items-center justify-between gap-4">
					<Link to="/" aria-label="Ver o site">
						<BrandLogo className="h-10" />
					</Link>

					{/* No desktop a saída fica no rodapé da barra; aqui em cima ela é a
					    única forma de encerrar a sessão sem a coluna lateral. */}
					<Button
						variant="outline"
						size="sm"
						onClick={aoSair}
						className="lg:hidden"
					>
						<LogOut aria-hidden="true" />
						Sair
					</Button>
				</div>

				<nav aria-label="Seções do painel" className="flex gap-1 lg:flex-col">
					{NAV.map((item) => (
						<Link
							key={item.to}
							to={item.to}
							activeOptions={{ exact: item.exact }}
							className="flex flex-1 items-center gap-3 rounded-md px-3 py-2 font-medium font-sans text-ink-soft text-sm transition-colors hover:bg-brand/8 hover:text-brand lg:flex-none [&.active]:bg-brand [&.active]:text-white"
						>
							<item.icon aria-hidden="true" className="size-4 shrink-0" />
							{item.label}
						</Link>
					))}
				</nav>

				<div className="mt-auto hidden lg:block">
					<Separator className="mb-4" />
					<p
						className="mb-3 truncate font-sans text-ink-faint text-xs"
						title={usuario}
					>
						{usuario}
					</p>
					<Button
						variant="outline"
						size="sm"
						onClick={aoSair}
						className="w-full"
					>
						<LogOut aria-hidden="true" />
						Sair
					</Button>
				</div>
			</aside>

			<main id="conteudo" className="min-w-0 px-5 py-8 lg:px-10">
				{children}
			</main>
		</div>
	);
}
