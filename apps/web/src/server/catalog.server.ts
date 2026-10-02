import {
	type CatalogoPublicado,
	resolverConteudo,
} from "@my-better-t-app/core";
import { getCache } from "@vercel/functions";
import { PUBLISHED_CONTENT } from "@/data/content";
import { PRODUCT_FAMILIES, PRODUCTS } from "@/data/products";
import { RECIPES } from "@/data/recipes";
import { createCatalogSource } from "@/server/catalog-source";

/**
 * O catálogo do site, ligado ao mundo real.
 *
 * Só roda no servidor, e só é alcançado por `import()` dinâmico — a partir da
 * função de servidor em `lib/catalog.ts`, do sitemap e da rota do tRPC. O
 * sufixo `.server` faz o Start recusar qualquer import vindo do cliente.
 *
 * O banco também entra por `import()` dinâmico, e só quando há
 * `DATABASE_URL`: é o que mantém o site respondendo 200 num ambiente sem
 * Postgres, servindo os arquivos de `src/data/` como reserva.
 */

/** O último retrato publicado por `pnpm run catalog:publish`. */
const RESERVA: CatalogoPublicado = {
	families: PRODUCT_FAMILIES,
	products: PRODUCTS,
	recipes: RECIPES,
	// Mesma função que resolve o que vem do banco: documento ausente ou que o
	// domínio não aceita mais vale o padrão.
	content: resolverConteudo(PUBLISHED_CONTENT),
};

let envCarregado: Promise<unknown> | undefined;

/**
 * O `.env` local só é lido pelo pacote de env, que mora atrás do import
 * dinâmico do banco. Sem carregá-lo aqui, a máquina de desenvolvimento teria
 * `DATABASE_URL` no arquivo e o site diria que não há banco.
 */
function carregarEnv(): Promise<unknown> {
	envCarregado ??= import("dotenv/config");
	return envCarregado;
}

const fonte = createCatalogSource({
	temBanco: () => Boolean(process.env.DATABASE_URL),
	lerDoBanco: async () => {
		const { lerCatalogoPublicado } = await import(
			"@my-better-t-app/api/published-catalog"
		);
		return lerCatalogoPublicado();
	},
	// Na Vercel é o Runtime Cache, comum a todas as instâncias; fora dela o
	// próprio `getCache` devolve um cache em memória com a mesma interface.
	cache: () => getCache(),
	reserva: RESERVA,
	registrar: (mensagem, erro) => console.error(`[catalogo] ${mensagem}`, erro),
});

export async function loadCatalog(): Promise<CatalogoPublicado> {
	await carregarEnv();
	return fonte.load();
}

export function expireCatalog(): Promise<void> {
	return fonte.expire();
}
