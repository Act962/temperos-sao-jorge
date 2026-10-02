import { Button } from "@my-better-t-app/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@my-better-t-app/ui/components/dialog";
import { Link, useRouterState } from "@tanstack/react-router";
import { ExternalLink, LogOut, Menu, X } from "lucide-react";
import { type ReactNode, useState } from "react";
import { NAV, secaoAtual } from "@/components/admin/nav";
import { BrandLogo } from "@/components/layout/brand-logo";

interface AdminShellProps {
	usuario: string;
	aoSair: () => void;
	children: ReactNode;
}

interface NavegacaoProps {
	usuario: string;
	aoSair: () => void;
	/** Na gaveta, escolher uma seção também a fecha. */
	aoNavegar?: () => void;
}

/** O miolo da barra lateral, igual na coluna fixa e na gaveta do celular. */
function Navegacao({ usuario, aoSair, aoNavegar }: NavegacaoProps) {
	return (
		<>
			<nav
				aria-label="Seções do painel"
				className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-4"
			>
				{NAV.map((grupo) => (
					<div key={grupo.grupo ?? "inicio"} className="flex flex-col gap-0.5">
						{grupo.grupo ? (
							<p className="px-3 pt-5 pb-1.5 font-bold font-sans text-[0.6875rem] text-ink-faint uppercase tracking-[0.12em]">
								{grupo.grupo}
							</p>
						) : null}
						{grupo.itens.map((item) => (
							<Link
								key={item.to}
								to={item.to}
								activeOptions={{ exact: item.exact }}
								onClick={aoNavegar}
								className="flex min-h-11 items-center gap-3 rounded-md px-3 font-medium font-sans text-ink-soft text-sm transition-colors hover:bg-brand/8 hover:text-brand lg:min-h-9 [&.active]:bg-brand [&.active]:text-white"
							>
								<item.icon aria-hidden="true" className="size-4 shrink-0" />
								{item.label}
							</Link>
						))}
					</div>
				))}
			</nav>

			<div className="border-brand/12 border-t px-5 py-4">
				<p
					className="mb-3 truncate font-sans text-ink-faint text-xs"
					title={usuario}
				>
					{usuario}
				</p>
				<Button variant="outline" onClick={aoSair} className="w-full">
					<LogOut aria-hidden="true" />
					Sair
				</Button>
			</div>
		</>
	);
}

/**
 * Moldura do painel: barra lateral, barra superior e área de conteúdo.
 *
 * Abaixo de `lg` a lateral vira gaveta. A versão anterior espremia os links
 * numa faixa horizontal no topo, o que deixou de caber assim que o menu
 * passou de três itens.
 */
export function AdminShell({ usuario, aoSair, children }: AdminShellProps) {
	const [gaveta, setGaveta] = useState(false);
	const pathname = useRouterState({
		select: (estado) => estado.location.pathname,
	});
	const secao = secaoAtual(pathname);

	return (
		<div className="min-h-svh bg-cream-sunken lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
			<aside className="hidden border-brand/12 border-r bg-cream-raised lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col">
				<div className="px-5 pt-5 pb-1">
					<BrandLogo className="h-10" />
				</div>
				<Navegacao usuario={usuario} aoSair={aoSair} />
			</aside>

			<Dialog open={gaveta} onOpenChange={setGaveta}>
				<DialogContent
					showCloseButton={false}
					className="data-closed:slide-out-to-left data-open:slide-in-from-left top-0 left-0 flex h-svh w-72 max-w-[85vw] translate-x-0 translate-y-0 flex-col gap-0 rounded-none! bg-cream-raised p-0 text-sm sm:max-w-[85vw] lg:hidden"
				>
					<div className="flex items-center justify-between gap-3 px-5 pt-4 pb-1">
						<BrandLogo className="h-9" />
						<Button
							variant="ghost"
							size="icon"
							aria-label="Fechar menu"
							onClick={() => setGaveta(false)}
						>
							<X aria-hidden="true" />
						</Button>
					</div>
					<DialogTitle className="sr-only">Menu do painel</DialogTitle>
					<DialogDescription className="sr-only">
						Seções do painel e saída da conta.
					</DialogDescription>
					<Navegacao
						usuario={usuario}
						aoSair={aoSair}
						aoNavegar={() => setGaveta(false)}
					/>
				</DialogContent>
			</Dialog>

			<div className="flex min-w-0 flex-col">
				<header className="sticky top-0 z-30 flex h-13 items-center gap-2 border-brand/12 border-b bg-cream-bright px-3 lg:px-8">
					<Button
						variant="outline"
						size="icon"
						aria-label="Abrir menu"
						onClick={() => setGaveta(true)}
						className="lg:hidden"
					>
						<Menu aria-hidden="true" />
					</Button>

					<p className="min-w-0 truncate font-sans text-ink-faint text-sm">
						<span className="max-sm:hidden">Painel / </span>
						<span className="font-semibold text-ink">
							{secao?.label ?? "Painel"}
						</span>
					</p>

					<Link
						to="/"
						target="_blank"
						rel="noreferrer"
						className="ml-auto flex min-h-11 items-center gap-1.5 rounded-md px-3 font-sans font-semibold text-ink-soft text-sm transition-colors hover:bg-brand/8 hover:text-brand lg:min-h-9"
					>
						Ver o site
						<ExternalLink aria-hidden="true" className="size-3.5" />
					</Link>
				</header>

				<main
					id="conteudo"
					className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
				>
					{children}
				</main>
			</div>
		</div>
	);
}
