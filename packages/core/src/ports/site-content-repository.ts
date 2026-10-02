import type { ChaveDeConteudo } from "../domain/site-content";

/**
 * Persistência dos documentos de conteúdo.
 *
 * O repositório guarda e devolve o documento cru, sem saber o que há dentro:
 * quem confere a forma é o domínio, na gravação e de novo na leitura. Um
 * documento salvo antes de uma mudança de formato chega aqui como estava.
 */
export interface SiteContentRepository {
	/** Só as chaves que já foram salvas alguma vez. */
	findAll(): Promise<Partial<Record<ChaveDeConteudo, unknown>>>;
	save(chave: ChaveDeConteudo, documento: unknown): Promise<void>;
}
