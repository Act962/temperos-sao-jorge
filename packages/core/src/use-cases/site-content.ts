import {
	CHAVES_DE_CONTEUDO,
	type ChaveDeConteudo,
	NORMALIZADORES,
	type SiteContent,
} from "../domain/site-content";
import { CONTEUDO_PADRAO } from "../domain/site-content-defaults";
import type { SiteContentRepository } from "../ports/site-content-repository";

/**
 * Monta o conteúdo do site a partir do que está salvo.
 *
 * Função pura, separada do repositório, porque dois caminhos chegam aqui com
 * o mesmo dado cru: a leitura do banco e a reserva em arquivo que o site usa
 * quando o banco não responde.
 *
 * Documento ausente vale o padrão. Documento que o domínio não aceita mais —
 * salvo num formato antigo, ou corrompido — também: o site mostra o texto de
 * fábrica em vez de quebrar a página, e a tela do painel abre o padrão para
 * ser salvo de novo.
 */
export function resolverConteudo(
	salvo: Partial<Record<ChaveDeConteudo, unknown>>,
	padrao: SiteContent = CONTEUDO_PADRAO,
): SiteContent {
	const resolver = <C extends ChaveDeConteudo>(chave: C): SiteContent[C] => {
		const documento = salvo[chave];
		if (documento === undefined || documento === null) return padrao[chave];
		try {
			return NORMALIZADORES[chave](documento as SiteContent[C]);
		} catch {
			return padrao[chave];
		}
	};

	return {
		settings: resolver("settings"),
		home: resolver("home"),
		about: resolver("about"),
		privacy: resolver("privacy"),
		cookies: resolver("cookies"),
	};
}

export async function obterConteudoDoSite(
	repo: SiteContentRepository,
): Promise<SiteContent> {
	return resolverConteudo(await repo.findAll());
}

/**
 * Grava um documento inteiro, depois de passar pelo normalizador dele.
 *
 * Devolve o que foi gravado, já aparado: é o que a tela deve mostrar depois
 * de salvar, para o formulário não ficar com espaços e linhas em branco que o
 * banco não tem.
 */
export async function salvarConteudo<C extends ChaveDeConteudo>(
	repo: SiteContentRepository,
	chave: C,
	entrada: SiteContent[C],
): Promise<SiteContent[C]> {
	const documento = NORMALIZADORES[chave](entrada);
	await repo.save(chave, documento);
	return documento;
}

export { CHAVES_DE_CONTEUDO };
