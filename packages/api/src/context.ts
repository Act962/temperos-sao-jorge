import { getAuth } from "@my-better-t-app/auth";
import { getUserDirectory } from "@my-better-t-app/auth/user-directory";
import { getServicosDeImagem } from "./images";
import { getRepositorios } from "./repos";

export type CreateContextOptions = {
	/** Requisição web padrão — antes era o contexto do Hono. */
	request: Request;
};

export async function createContext({ request }: CreateContextOptions) {
	const session = await getAuth().api.getSession({
		headers: request.headers,
	});

	return {
		session,
		repos: getRepositorios(),
		usuarios: getUserDirectory(),
		// Função, não valor: só quem troca ou apaga foto paga o carregamento do
		// bucket e do `sharp`.
		imagens: getServicosDeImagem,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
