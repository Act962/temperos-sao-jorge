import {
	CHAVES_DE_CONTEUDO,
	type ChaveDeConteudo,
	type SiteContentRepository,
} from "@my-better-t-app/core";
import type { Database } from "../index";
import { siteContent } from "../schema/content";

const CHAVES: readonly string[] = CHAVES_DE_CONTEUDO;

/** Adaptador Drizzle dos documentos de conteúdo. */
export class DrizzleSiteContentRepository implements SiteContentRepository {
	constructor(private readonly db: Database) {}

	async findAll(): Promise<Partial<Record<ChaveDeConteudo, unknown>>> {
		const linhas = await this.db.select().from(siteContent);

		const documentos: Partial<Record<ChaveDeConteudo, unknown>> = {};
		for (const linha of linhas) {
			// Chave que o domínio não conhece — de uma versão futura, ou sobra de
			// uma antiga — é ignorada em vez de chegar ao site sem tipo.
			if (CHAVES.includes(linha.key)) {
				documentos[linha.key as ChaveDeConteudo] = linha.data;
			}
		}
		return documentos;
	}

	async save(chave: ChaveDeConteudo, documento: unknown): Promise<void> {
		await this.db
			.insert(siteContent)
			.values({ key: chave, data: documento })
			.onConflictDoUpdate({
				target: siteContent.key,
				set: { data: documento, updatedAt: new Date() },
			});
	}
}
