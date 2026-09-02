import {
	atualizarProduto,
	ConflictError,
	criarFamilia,
	criarNovaReceita,
	criarNovoProduto,
	criarProduto,
	criarReceita,
	InvalidInputError,
	listarFamiliasComContagem,
	listarProdutosDaFamilia,
	NotFoundError,
	obterProduto,
	obterReceita,
	removerProduto,
} from "@my-better-t-app/core";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import * as schema from "../schema";
import {
	product,
	productFamily,
	recipe,
	recipeProduct,
} from "../schema/catalog";
import { repositoriosDrizzle } from "./catalog";

/**
 * Teste de integração dos adaptadores Drizzle.
 *
 * Roda os mesmos casos de uso que a suíte em memória exercita — a diferença é
 * só o adaptador. É isso que a arquitetura hexagonal compra: se um caso de uso
 * passa aqui e lá, a regra está no domínio e não no SQL.
 *
 * Precisa de Postgres. Sem `DATABASE_URL` a suíte é pulada, para o CI e a
 * máquina de quem só mexe no site não dependerem de banco.
 */
const url = process.env.DATABASE_URL;

describe.skipIf(!url)("repositórios Drizzle", () => {
	// Com o schema: sem ele o tipo do db não bate com a porta do repositório.
	const db = drizzle(url ?? "", { schema });
	const repos = repositoriosDrizzle(db);

	beforeEach(async () => {
		await db.execute(
			sql`truncate table ${recipeProduct}, ${recipe}, ${product}, ${productFamily} restart identity cascade`,
		);

		await repos.products.saveFamily(
			criarFamilia({ slug: "chas", name: "Chás", position: 0 }),
		);
		await repos.products.saveFamily(
			criarFamilia({
				slug: "temperos-em-po",
				name: "Temperos em Pó",
				position: 1,
			}),
		);
		await repos.products.save(
			criarProduto({
				slug: "camomila",
				name: "Camomila",
				familySlug: "chas",
				image: "/images/products/chas/sachet-camomila.webp",
				position: 1,
			}),
		);
		await repos.products.save(
			criarProduto({
				slug: "boldo",
				name: "Boldo",
				familySlug: "chas",
				position: 0,
			}),
		);
	});

	afterAll(async () => {
		await db.execute(
			sql`truncate table ${recipeProduct}, ${recipe}, ${product}, ${productFamily} restart identity cascade`,
		);
	});

	it("percorre a ida e a volta preservando os campos", async () => {
		const produto = await obterProduto(repos.products, "camomila");
		expect(produto).toEqual({
			slug: "camomila",
			name: "Camomila",
			familySlug: "chas",
			image: "/images/products/chas/sachet-camomila.webp",
			position: 1,
		});
	});

	it("guarda packshot ausente como null, não string vazia", async () => {
		expect((await obterProduto(repos.products, "boldo")).image).toBeNull();
	});

	it("ordena por posição, como em memória", async () => {
		const produtos = await listarProdutosDaFamilia(repos.products, "chas");
		expect(produtos.map((p) => p.slug)).toEqual(["boldo", "camomila"]);
	});

	it("deriva a contagem por família a partir das linhas", async () => {
		const familias = await listarFamiliasComContagem(repos.products);
		expect(familias.map((f) => [f.slug, f.count])).toEqual([
			["chas", 2],
			["temperos-em-po", 0],
		]);
	});

	it("aplica as mesmas regras de domínio que o adaptador em memória", async () => {
		await expect(
			criarNovoProduto(repos.products, {
				slug: "camomila",
				name: "Duplicada",
				familySlug: "chas",
			}),
		).rejects.toThrow(ConflictError);

		await expect(
			criarNovoProduto(repos.products, {
				slug: "orfao",
				name: "Órfão",
				familySlug: "familia-fantasma",
			}),
		).rejects.toThrow(NotFoundError);
	});

	it("persiste a atualização", async () => {
		await atualizarProduto(repos.products, "camomila", {
			name: "Camomila Premium",
		});
		expect((await obterProduto(repos.products, "camomila")).name).toBe(
			"Camomila Premium",
		);
	});

	it("remove de verdade", async () => {
		await removerProduto(repos, "boldo");
		await expect(obterProduto(repos.products, "boldo")).rejects.toThrow(
			NotFoundError,
		);
	});

	describe("receitas", () => {
		const base = {
			slug: "cha-gelado",
			name: "Chá Gelado",
			summary: "Refrescante.",
			minutes: 10,
			level: "Fácil" as const,
			servings: 2,
			category: "Lanches" as const,
			ingredients: ["1 sachê de camomila", "Gelo"],
			steps: ["Ferva a água.", "Deixe esfriar."],
		};

		it("preserva a ordem dos ingredientes, dos passos e dos produtos", async () => {
			await criarNovaReceita(repos, {
				...base,
				usedProductSlugs: ["camomila", "boldo"],
			});

			const salva = await obterReceita(repos.recipes, "cha-gelado");
			expect(salva.ingredients).toEqual(base.ingredients);
			expect(salva.steps).toEqual(base.steps);
			// A ordem vem da coluna `position` da tabela de vínculo, não da inserção.
			expect(salva.usedProductSlugs).toEqual(["camomila", "boldo"]);
		});

		it("substitui os vínculos ao regravar, sem acumular", async () => {
			await criarNovaReceita(repos, {
				...base,
				usedProductSlugs: ["camomila", "boldo"],
			});
			await repos.recipes.save(
				criarReceita({ ...base, usedProductSlugs: ["boldo"] }),
			);

			expect(
				(await obterReceita(repos.recipes, "cha-gelado")).usedProductSlugs,
			).toEqual(["boldo"]);
		});

		it("recusa citar produto inexistente", async () => {
			await expect(
				criarNovaReceita(repos, { ...base, usedProductSlugs: ["fantasma"] }),
			).rejects.toThrow(InvalidInputError);
		});

		it("barra a remoção do produto citado antes do Postgres reclamar", async () => {
			await criarNovaReceita(repos, {
				...base,
				usedProductSlugs: ["camomila"],
			});

			// O `restrict` da chave estrangeira também barraria, mas com uma
			// mensagem que ninguém lê. O domínio chega primeiro e nomeia a receita.
			await expect(removerProduto(repos, "camomila")).rejects.toThrow(
				/"Chá Gelado" cita este produto/,
			);
		});

		it("apaga os vínculos junto com a receita", async () => {
			await criarNovaReceita(repos, {
				...base,
				usedProductSlugs: ["camomila"],
			});
			await repos.recipes.delete("cha-gelado" as never);

			const restantes = await db.select().from(recipeProduct);
			expect(restantes).toEqual([]);
		});
	});
});
