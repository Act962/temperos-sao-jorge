import {
	CONTEUDO_PADRAO,
	obterConteudoDoSite,
	salvarConteudo,
} from "@my-better-t-app/core";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import * as schema from "../schema";
import { siteContent } from "../schema/content";
import { DrizzleSiteContentRepository } from "./content";

/**
 * Os documentos de conteúdo contra Postgres de verdade.
 *
 * O que só aparece aqui é a ida e a volta pelo `jsonb`: acento, quebra de
 * linha, lista vazia e booleano têm que voltar como foram. Mesmo critério da
 * suíte do catálogo — sem `DATABASE_URL`, é pulada.
 */
const url = process.env.DATABASE_URL;

describe.skipIf(!url)("documentos de conteúdo no Drizzle", () => {
	const db = drizzle(url ?? "", { schema });
	const repo = new DrizzleSiteContentRepository(db);
	const limpar = () => db.execute(sql`truncate table ${siteContent}`);

	beforeEach(limpar);
	afterAll(limpar);

	it("tabela vazia devolve nenhum documento, e o site mostra o padrão", async () => {
		expect(await repo.findAll()).toEqual({});
		expect(await obterConteudoDoSite(repo)).toEqual(CONTEUDO_PADRAO);
	});

	it("percorre a ida e a volta preservando o documento inteiro", async () => {
		const salvo = await salvarConteudo(repo, "home", {
			...CONTEUDO_PADRAO.home,
			hero: {
				...CONTEUDO_PADRAO.home.hero,
				title: "Tempero bom\nde verdade",
			},
		});

		const { home } = await obterConteudoDoSite(repo);
		expect(home).toEqual(salvo);
		expect(home.hero.title).toBe("Tempero bom\nde verdade");
	});

	it("regrava a mesma chave em vez de acumular linhas", async () => {
		const base = CONTEUDO_PADRAO.settings;
		await salvarConteudo(repo, "settings", base);
		await salvarConteudo(repo, "settings", {
			...base,
			social: [],
			contact: { ...base.contact, hasVerifiedAddress: true },
		});

		const linhas = await db.select().from(siteContent);
		expect(linhas).toHaveLength(1);

		const { settings } = await obterConteudoDoSite(repo);
		expect(settings.social).toEqual([]);
		expect(settings.contact.hasVerifiedAddress).toBe(true);
	});

	it("ignora chave que o domínio não conhece", async () => {
		await db
			.insert(siteContent)
			.values({ key: "de-uma-versao-futura", data: { qualquer: "coisa" } });

		expect(await repo.findAll()).toEqual({});
	});
});
