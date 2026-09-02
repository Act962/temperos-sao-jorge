import { createFileRoute } from "@tanstack/react-router";

/**
 * Better-Auth, servido pelo próprio TanStack Start.
 *
 * Antes isto vivia num app Hono separado na porta 3000. Agora é a mesma
 * origem do site, o que dispensa CORS e reduz o deploy a um artefato só.
 *
 * O import é dinâmico de propósito: `@my-better-t-app/auth` puxa o env do
 * servidor, que valida DATABASE_URL na importação. Estático aqui, o site
 * público inteiro passaria a exigir Postgres no boot — e ele não usa banco,
 * porque o conteúdo é publicado estaticamente.
 */
async function handle(request: Request): Promise<Response> {
	const { getAuth } = await import("@my-better-t-app/auth");
	return getAuth().handler(request);
}

export const Route = createFileRoute("/api/auth/$")({
	server: {
		handlers: {
			GET: ({ request }) => handle(request),
			POST: ({ request }) => handle(request),
		},
	},
});
