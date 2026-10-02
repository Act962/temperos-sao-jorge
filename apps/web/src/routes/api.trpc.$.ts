import { createFileRoute } from "@tanstack/react-router";
import { shouldExpireCatalog } from "@/server/catalog-source";

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

	const resposta = await fetchRequestHandler({
		endpoint: "/api/trpc",
		req: request,
		router: appRouter,
		createContext: () => createContext({ request }),
	});

	// Toda mutação chega por POST. Expirar aqui, e não em cada procedimento,
	// é o que impede uma mutação nova de esquecer de avisar o site: salvar no
	// painel é publicar, e a visita seguinte tem que ler do banco.
	if (shouldExpireCatalog(request.method, resposta.ok)) {
		const { expireCatalog } = await import("@/server/catalog.server");
		await expireCatalog();
	}

	return resposta;
}

export const Route = createFileRoute("/api/trpc/$")({
	server: {
		handlers: {
			GET: ({ request }) => handle(request),
			POST: ({ request }) => handle(request),
		},
	},
});
