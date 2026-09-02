import { beforeEach, describe, expect, it } from "vitest";
import {
	ConflictError,
	InvalidInputError,
	NotFoundError,
} from "../domain/errors";
import { criarFamilia, criarProduto } from "../domain/product";
import { criarReceita } from "../domain/recipe";
import type { CatalogRepositories } from "../ports/catalog-repository";
import { repositoriosEmMemoria } from "../testing/in-memory-repositories";
import {
	atualizarProduto,
	criarNovaFamilia,
	criarNovoProduto,
	listarFamiliasComContagem,
	listarProdutosDaFamilia,
	obterProduto,
	removerProduto,
} from "./products";
import { atualizarReceita, criarNovaReceita, obterReceita } from "./recipes";

/**
 * Todos os casos de uso rodam contra memória, sem Postgres.
 *
 * O mesmo código roda contra Drizzle em produção: a troca é só de adaptador.
 */
let repos: CatalogRepositories;

beforeEach(() => {
	repos = repositoriosEmMemoria({
		families: [
			criarFamilia({ slug: "chas", name: "Chás", position: 0 }),
			criarFamilia({
				slug: "temperos-em-po",
				name: "Temperos em Pó",
				position: 1,
			}),
		],
		products: [
			criarProduto({
				slug: "camomila",
				name: "Camomila",
				familySlug: "chas",
				image: "/images/products/chas/sachet-camomila.webp",
				position: 1,
			}),
			criarProduto({
				slug: "boldo",
				name: "Boldo",
				familySlug: "chas",
				position: 0,
			}),
		],
	});
});

describe("listagem de produtos", () => {
	it("ordena por posição, não por inserção", async () => {
		const produtos = await listarProdutosDaFamilia(repos.products, "chas");
		expect(produtos.map((p) => p.slug)).toEqual(["boldo", "camomila"]);
	});

	it("falha em família inexistente em vez de devolver lista vazia", async () => {
		// Lista vazia esconderia um slug errado numa URL; o erro é explícito.
		await expect(
			listarProdutosDaFamilia(repos.products, "nao-existe"),
		).rejects.toThrow(NotFoundError);
	});
});

describe("contagem por família", () => {
	it("deriva do catálogo, sem campo redundante", async () => {
		const familias = await listarFamiliasComContagem(repos.products);
		expect(familias).toEqual([
			expect.objectContaining({ slug: "chas", count: 2 }),
			expect.objectContaining({ slug: "temperos-em-po", count: 0 }),
		]);
	});

	it("acompanha a criação de um produto", async () => {
		await criarNovoProduto(repos.products, {
			slug: "paprica-doce",
			name: "Páprica Doce",
			familySlug: "temperos-em-po",
		});

		const familias = await listarFamiliasComContagem(repos.products);
		expect(familias.find((f) => f.slug === "temperos-em-po")?.count).toBe(1);
	});
});

describe("criação de produto", () => {
	it("recusa slug já ocupado", async () => {
		await expect(
			criarNovoProduto(repos.products, {
				slug: "camomila",
				name: "Outra Camomila",
				familySlug: "chas",
			}),
		).rejects.toThrow(ConflictError);
	});

	it("recusa família inexistente", async () => {
		// Sem família o produto sumiria de toda navegação do site.
		await expect(
			criarNovoProduto(repos.products, {
				slug: "novo",
				name: "Novo",
				familySlug: "familia-fantasma",
			}),
		).rejects.toThrow(NotFoundError);
	});
});

describe("atualização de produto", () => {
	it("altera só o que foi informado", async () => {
		const atualizado = await atualizarProduto(repos.products, "camomila", {
			name: "Camomila Premium",
		});

		expect(atualizado.name).toBe("Camomila Premium");
		expect(atualizado.image).toBe("/images/products/chas/sachet-camomila.webp");
	});

	it("permite limpar o packshot passando null", async () => {
		const atualizado = await atualizarProduto(repos.products, "camomila", {
			image: null,
		});
		expect(atualizado.image).toBeNull();
	});

	it("recusa mudança para família inexistente", async () => {
		await expect(
			atualizarProduto(repos.products, "camomila", {
				familySlug: "familia-fantasma",
			}),
		).rejects.toThrow(NotFoundError);
	});

	it("recusa mudar de família deixando o packshot na pasta antiga", async () => {
		await expect(
			atualizarProduto(repos.products, "camomila", {
				familySlug: "temperos-em-po",
			}),
		).rejects.toThrow(/outra família/);
	});
});

describe("remoção de produto", () => {
	it("remove e depois não encontra", async () => {
		await removerProduto(repos, "boldo");
		await expect(obterProduto(repos.products, "boldo")).rejects.toThrow(
			NotFoundError,
		);
	});

	it("falha ao remover o que não existe", async () => {
		await expect(removerProduto(repos, "fantasma")).rejects.toThrow(
			NotFoundError,
		);
	});

	it("recusa remover produto citado por receita, nomeando quem cita", async () => {
		await criarNovaReceita(repos, {
			slug: "cha-da-tarde",
			name: "Chá da Tarde",
			summary: "",
			minutes: 10,
			level: "Fácil",
			servings: 2,
			category: "Lanches",
			ingredients: ["Água"],
			steps: ["Ferver"],
			usedProductSlugs: ["camomila"],
		});

		// A mensagem precisa nomear a receita: sem isso o autor não sabe onde
		// mexer, e o erro do Postgres não diz.
		await expect(removerProduto(repos, "camomila")).rejects.toThrow(
			/"Chá da Tarde" cita este produto/,
		);
		await expect(removerProduto(repos, "camomila")).rejects.toThrow(
			ConflictError,
		);
	});

	it("libera a remoção depois que a receita deixa de citar", async () => {
		await criarNovaReceita(repos, {
			slug: "cha-da-tarde",
			name: "Chá da Tarde",
			summary: "",
			minutes: 10,
			level: "Fácil",
			servings: 2,
			category: "Lanches",
			ingredients: ["Água"],
			steps: ["Ferver"],
			usedProductSlugs: ["camomila"],
		});
		await atualizarReceita(repos, "cha-da-tarde", { usedProductSlugs: [] });

		await removerProduto(repos, "camomila");
		await expect(obterProduto(repos.products, "camomila")).rejects.toThrow(
			NotFoundError,
		);
	});
});

describe("família", () => {
	it("recusa slug já ocupado", async () => {
		await expect(
			criarNovaFamilia(repos.products, { slug: "chas", name: "Chás" }),
		).rejects.toThrow(ConflictError);
	});
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
		ingredients: ["1 sachê de camomila"],
		steps: ["Ferva a água."],
	};

	it("aceita receita que cita produto existente", async () => {
		const receita = await criarNovaReceita(repos, {
			...base,
			usedProductSlugs: ["camomila"],
		});
		expect(receita.usedProductSlugs).toEqual(["camomila"]);
	});

	it("recusa receita que cita produto inexistente", async () => {
		// A seção "Produtos utilizados" simplesmente encolheria, sem erro.
		await expect(
			criarNovaReceita(repos, { ...base, usedProductSlugs: ["nao-existe"] }),
		).rejects.toThrow(InvalidInputError);
	});

	it("revalida os produtos citados ao atualizar", async () => {
		await criarNovaReceita(repos, base);
		await expect(
			atualizarReceita(repos, "cha-gelado", {
				usedProductSlugs: ["produto-removido"],
			}),
		).rejects.toThrow(InvalidInputError);
	});

	it("preserva os campos não informados na atualização", async () => {
		await repos.recipes.save(criarReceita(base));
		const atualizada = await atualizarReceita(repos, "cha-gelado", {
			minutes: 15,
		});

		expect(atualizada.minutes).toBe(15);
		expect(atualizada.name).toBe("Chá Gelado");
	});

	it("falha ao buscar receita inexistente", async () => {
		await expect(obterReceita(repos.recipes, "fantasma")).rejects.toThrow(
			NotFoundError,
		);
	});
});
