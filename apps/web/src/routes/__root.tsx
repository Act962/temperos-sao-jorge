import type { AppRouter } from "@my-better-t-app/api/routers/index";
import { Toaster } from "@my-better-t-app/ui/components/sonner";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
	useRouterState,
} from "@tanstack/react-router";
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SITE } from "@/data/site";
import {
	jsonLdScript,
	organizationSchema,
	webSiteSchema,
} from "@/lib/structured-data";

import appCss from "../index.css?url";

export interface RouterAppContext {
	trpc: TRPCOptionsProxy<AppRouter>;
	queryClient: QueryClient;
}

/**
 * The root emits only document-wide tags. Everything page-specific — title,
 * description, robots, canonical, og:url — belongs to the leaf route: `link`
 * tags are not de-duplicated by `rel`, so a canonical declared here would ship
 * alongside every page's own and leave two conflicting canonicals in the head.
 */
export const Route = createRootRouteWithContext<RouterAppContext>()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ name: "theme-color", content: "#8c1414" },
			{ name: "author", content: SITE.name },
			{ property: "og:site_name", content: SITE.name },
			{ property: "og:locale", content: SITE.locale },
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			// Ícones gerados do master da marca por scripts/generate-favicons.mjs.
			{ rel: "icon", href: "/favicon.ico", sizes: "any" },
			{
				rel: "icon",
				href: "/favicon-32.png",
				type: "image/png",
				sizes: "32x32",
			},
			{
				rel: "icon",
				href: "/favicon-192.png",
				type: "image/png",
				sizes: "192x192",
			},
			{ rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
			{ rel: "preconnect", href: "https://fonts.googleapis.com" },
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous",
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800&family=Barlow:wght@300;400;500;600;700&family=Caveat:wght@400;500&display=swap",
			},
		],
		scripts: [
			jsonLdScript(organizationSchema()),
			jsonLdScript(webSiteSchema()),
		],
	}),

	component: RootDocument,
});

function RootDocument() {
	// O painel traz a própria moldura (barra lateral, ou a tela de acesso em tela
	// cheia). Reaproveitar o cabeçalho e o rodapé do site aqui colocaria o menu
	// público e o formulário de newsletter dentro da administração — e um
	// `<main>` dentro de outro, que é HTML inválido.
	const noAdmin = useRouterState({
		select: (estado) => estado.location.pathname.startsWith("/admin"),
	});

	return (
		<html lang={SITE.lang}>
			<head>
				<HeadContent />
			</head>
			<body>
				{noAdmin ? null : (
					<a
						href="#conteudo"
						className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-100 focus:rounded-[4px] focus:bg-brand focus:px-4 focus:py-2 focus:font-sans focus:font-semibold focus:text-sm focus:text-white"
					>
						Pular para o conteúdo
					</a>
				)}

				{noAdmin ? (
					<Outlet />
				) : (
					<div className="flex min-h-svh flex-col">
						<SiteHeader />
						<main id="conteudo" className="flex-1">
							<Outlet />
						</main>
						<SiteFooter />
					</div>
				)}

				<Toaster richColors position="top-center" />
				<Scripts />
			</body>
		</html>
	);
}
