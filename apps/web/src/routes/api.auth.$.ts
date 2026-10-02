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
const CADASTRO_FECHADO = {
	code: "CADASTRO_FECHADO",
	message:
		"O cadastro pelo site está fechado. Peça a um administrador para criar o seu acesso no painel.",
};

async function handle(request: Request): Promise<Response> {
	const { getAuth } = await import("@my-better-t-app/auth");

	// O cadastro público só existe para o primeiro acesso, num banco sem
	// usuário nenhum. Depois disso, conta nova só nasce pela tela de usuários,
	// por quem já está dentro — senão quem conhecesse este endereço viraria
	// administrador, e o que o painel grava vai ao ar na hora.
	//
	// A barreira fica aqui, e não num gancho do Better-Auth, porque a criação
	// pela tela chama a API dele do lado do servidor: um gancho barraria as
	// duas. Esta rota é o único caminho de fora para dentro.
	if (!new URL(request.url).pathname.includes("/sign-up")) {
		return getAuth().handler(request);
	}

	const [{ cadastroPeloSiteAberto, confirmarPrimeiroCadastro }, diretorio] =
		await Promise.all([
			import("@my-better-t-app/core"),
			import("@my-better-t-app/auth/user-directory").then((modulo) =>
				modulo.getUserDirectory(),
			),
		]);

	if (!(await cadastroPeloSiteAberto(diretorio))) {
		return Response.json(CADASTRO_FECHADO, { status: 403 });
	}

	const resposta = await getAuth().handler(request);
	if (!resposta.ok) return resposta;

	// Duas requisições simultâneas passam juntas pela conferência acima. Só a
	// conta mais antiga fica; a outra é desfeita e recebe o mesmo 403 — sem o
	// cookie de sessão, que estava na resposta descartada.
	const corpo: unknown = await resposta
		.clone()
		.json()
		.catch(() => null);
	const idCriado =
		typeof corpo === "object" && corpo !== null && "user" in corpo
			? (corpo.user as { id?: unknown } | null)?.id
			: undefined;

	if (
		typeof idCriado === "string" &&
		!(await confirmarPrimeiroCadastro(diretorio, idCriado))
	) {
		return Response.json(CADASTRO_FECHADO, { status: 403 });
	}

	return resposta;
}

export const Route = createFileRoute("/api/auth/$")({
	server: {
		handlers: {
			GET: ({ request }) => handle(request),
			POST: ({ request }) => handle(request),
		},
	},
});
