import {
	type CatalogoPublicado,
	montarCatalogoPublicado,
} from "@my-better-t-app/core";
import { getRepositorios } from "./repos";

/**
 * Leitura do catálogo para o site público, direto do banco.
 *
 * Só pode ser alcançada por `import()` dinâmico: este módulo carrega o env do
 * servidor, e um import estático a partir de uma rota do site faria a página
 * exigir `DATABASE_URL` para subir. Quem chama é
 * `apps/web/src/server/catalog.server.ts`, que também cuida do cache e da
 * reserva quando o banco não responde.
 */
export function lerCatalogoPublicado(): Promise<CatalogoPublicado> {
	return montarCatalogoPublicado(getRepositorios());
}
