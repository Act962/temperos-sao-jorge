import type { AppRouter } from "@my-better-t-app/api/routers/index";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { toast } from "sonner";

import { NotFound } from "./components/ui/not-found";
import { RouteLoader } from "./components/ui/route-loader";
import { routeTree } from "./routeTree.gen";
import { TRPCProvider } from "./utils/trpc";

function createQueryClient() {
	return new QueryClient({
		queryCache: new QueryCache({
			onError: (error, query) => {
				toast.error(error.message, {
					action: {
						label: "retry",
						onClick: () => {
							query.invalidate();
						},
					},
				});
			},
		}),
		defaultOptions: { queries: { staleTime: 60 * 1000 } },
	});
}

/**
 * A API vive na mesma origem desde a fusão do backend Hono no TanStack Start,
 * então basta um caminho relativo — sem host, sem CORS, sem credentials.
 */
const trpcClient = createTRPCClient<AppRouter>({
	links: [httpBatchLink({ url: "/api/trpc" })],
});

export const getRouter = () => {
	const queryClient = createQueryClient();
	const trpc = createTRPCOptionsProxy({
		client: trpcClient,
		queryClient,
	});

	const router = createTanStackRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreloadStaleTime: 0,
		context: { trpc, queryClient },
		defaultPendingComponent: () => <RouteLoader />,
		defaultNotFoundComponent: () => <NotFound />,
		Wrap: ({ children }) => (
			<TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
				{children}
			</TRPCProvider>
		),
	});

	setupRouterSsrQueryIntegration({
		router,
		queryClient,
	});

	return router;
};

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
