import { createFileRoute } from "@tanstack/react-router";

/**
 * tRPC servido pelo TanStack Start, no lugar do adaptador Hono.
 *
 * Import dinâmico pelo mesmo motivo da rota de auth: o roteador alcança o env
 * do servidor, e carregá-lo no boot obrigaria o site público a ter Postgres.
 */
async function handle(request: Request): Promise<Response> {
	const [{ fetchRequestHandler }, { appRouter }, { createContext }] =
		await Promise.all([
			import("@trpc/server/adapters/fetch"),
			import("@my-better-t-app/api/routers/index"),
			import("@my-better-t-app/api/context"),
		]);

	return fetchRequestHandler({
		endpoint: "/api/trpc",
		req: request,
		router: appRouter,
		createContext: () => createContext({ request }),
	});
}

export const Route = createFileRoute("/api/trpc/$")({
	server: {
		handlers: {
			GET: ({ request }) => handle(request),
			POST: ({ request }) => handle(request),
		},
	},
});
