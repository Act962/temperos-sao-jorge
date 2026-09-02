import { createFileRoute } from "@tanstack/react-router";
import { renderRobots } from "@/lib/robots";

export const Route = createFileRoute("/robots.txt")({
	server: {
		handlers: {
			GET: ({ request }) => {
				const cabecalhos = request.headers;
				const host =
					cabecalhos.get("x-forwarded-host") ?? cabecalhos.get("host");

				return new Response(renderRobots(host), {
					headers: {
						"content-type": "text/plain; charset=utf-8",
						// Curto de propósito: apontar o domínio definitivo troca a
						// resposta, e um cache longo seguraria o `Disallow` no ar.
						"cache-control": "public, max-age=300",
					},
				});
			},
		},
	},
});
