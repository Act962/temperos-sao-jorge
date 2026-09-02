import { getAuth } from "@my-better-t-app/auth";

export type CreateContextOptions = {
	/** Requisição web padrão — antes era o contexto do Hono. */
	request: Request;
};

export async function createContext({ request }: CreateContextOptions) {
	const session = await getAuth().api.getSession({
		headers: request.headers,
	});

	return { session };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
