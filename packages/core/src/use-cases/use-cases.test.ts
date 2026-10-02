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
	removerFamilia,
	removerProduto,
	renomearFamilia,
	reordenarFamilias,
} from "./products";
import { montarCatalogoPublicado } from "./published-catalog";
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

describe("criação pelo painel, só com o nome", () => {
	it("deriva o slug do nome do produto", async () => {
		const produto = await criarNovoProduto(repos.products, {
			name: "Páprica Doce 1 kg",
			familySlug: "temperos-em-po",
		});
		expect(produto.slug).toBe("paprica-doce-1-kg");
	});

	it("coloca o produto novo no fim da lista", async () => {
		// Com a posição padrão 0 ele empatava com o primeiro e aparecia antes
		// do catálogo inteiro.
		const produto = await criarNovoProduto(repos.products, {
			name: "Hortelã",
			familySlug: "chas",
		});
		expect(produto.position).toBe(2);

		const lista = await listarProdutosDaFamilia(repos.products, "chas");
		expect(lista.at(-1)?.slug).toBe("hortela");
	});

	it("recusa nome que deriva um slug já usado", async () => {
		await expect(
			criarNovoProduto(repos.products, {
				name: "Camomila",
				familySlug: "chas",
			}),
		).rejects.toThrow(/Já existe um produto com o slug "camomila"/);
	});

	it("deriva o slug e a posição da família", async () => {
		const familia = await criarNovaFamilia(repos.products, {
			name: "Molhos e Pastas",
		});
		expect(familia.slug).toBe("molhos-e-pastas");
		expect(familia.position).toBe(2);
	});
});

describe("família", () => {
	it("recusa slug já ocupado", async () => {
		await expect(
			criarNovaFamilia(repos.products, { slug: "chas", name: "Chás" }),
		).rejects.toThrow(ConflictError);
	});

	it("renomeia sem mexer no slug nem na posição", async () => {
		const familia = await renomearFamilia(
			repos.products,
			"temperos-em-po",
			"Temperos Secos",
		);

		expect(familia).toEqual({
			slug: "temperos-em-po",
			name: "Temperos Secos",
			position: 1,
		});
	});

	it("recusa renomear para vazio", async () => {
		await expect(
			renomearFamilia(repos.products, "chas", "   "),
		).rejects.toThrow(InvalidInputError);
	});

	it("recusa remover família com produtos, dizendo quantos", async () => {
		// O banco barra pela chave estrangeira, mas sem dizer o que fazer.
		await expect(removerFamilia(repos.products, "chas")).rejects.toThrow(
			/"Chás": 2 produtos ainda estão nesta família/,
		);
		await expect(removerFamilia(repos.products, "chas")).rejects.toThrow(
			ConflictError,
		);
	});

	it("remove família vazia", async () => {
		await removerFamilia(repos.products, "temperos-em-po");

		const familias = await listarFamiliasComContagem(repos.products);
		expect(familias.map((f) => f.slug)).toEqual(["chas"]);
	});

	it("regrava a ordem inteira", async () => {
		await reordenarFamilias(repos.products, ["temperos-em-po", "chas"]);

		const familias = await listarFamiliasComContagem(repos.products);
		expect(familias.map((f) => f.slug)).toEqual(["temperos-em-po", "chas"]);
	});

	it.each([
		["parcial", ["chas"]],
		["com repetição", ["chas", "chas"]],
		["com slug desconhecido", ["chas", "fantasma"]],
	])("recusa ordem %s sem gravar nada", async (_caso, ordem) => {
		await expect(reordenarFamilias(repos.products, ordem)).rejects.toThrow(
			InvalidInputError,
		);

		const familias = await listarFamiliasComContagem(repos.products);
		expect(familias.map((f) => f.slug)).toEqual(["chas", "temperos-em-po"]);
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

describe("catálogo na forma do site", () => {
	it("leva a contagem na família e o nome da família no produto", async () => {
		const catalogo = await montarCatalogoPublicado(repos);

		expect(catalogo.families).toEqual([
			{ slug: "chas", name: "Chás", count: 2 },
			{ slug: "temperos-em-po", name: "Temperos em Pó", count: 0 },
		]);
		expect(catalogo.products[0]).toEqual({
			slug: "boldo",
			name: "Boldo",
			familySlug: "chas",
			family: "Chás",
			// Foto ausente vira texto vazio: é o que o retrato publicado guarda.
			image: "",
		});
	});

	it("deriva o tempo exibido dos minutos e ordena as receitas por slug", async () => {
		const base = {
			summary: "",
			level: "Fácil" as const,
			servings: 2,
			category: "Lanches" as const,
			ingredients: ["Água"],
			steps: ["Ferver"],
		};
		await criarNovaReceita(repos, {
			...base,
			slug: "pao-de-ervas",
			name: "Pão de Ervas",
			minutes: 80,
		});
		await criarNovaReceita(repos, {
			...base,
			slug: "cha-gelado",
			name: "Chá Gelado",
			minutes: 10,
			usedProductSlugs: ["camomila"],
		});

		const { recipes } = await montarCatalogoPublicado(repos);

		expect(recipes.map((r) => [r.slug, r.time])).toEqual([
			["cha-gelado", "10 min"],
			["pao-de-ervas", "1 h 20 min"],
		]);
		expect(recipes[0]?.usedProductSlugs).toEqual(["camomila"]);
	});

	it("ordena por caractere, sem depender do idioma da máquina", async () => {
		const base = {
			summary: "",
			minutes: 30,
			level: "Fácil" as const,
			servings: 2,
			category: "Almoço" as const,
			ingredients: ["Massa"],
			steps: ["Cozinhar"],
		};
		// Com `localeCompare` em pt-BR o hífen é ignorado e a ordem inverte.
		await criarNovaReceita(repos, {
			...base,
			slug: "macarrao-ao-molho",
			name: "Macarrão ao Molho",
		});
		await criarNovaReceita(repos, {
			...base,
			slug: "macarrao-a-primavera",
			name: "Macarrão à Primavera",
		});

		const { recipes } = await montarCatalogoPublicado(repos);
		expect(recipes.map((r) => r.slug)).toEqual([
			"macarrao-a-primavera",
			"macarrao-ao-molho",
		]);
	});

	it("reflete uma edição na leitura seguinte", async () => {
		await atualizarProduto(repos.products, "boldo", { name: "Boldo do Chile" });

		const { products } = await montarCatalogoPublicado(repos);
		expect(products[0]?.name).toBe("Boldo do Chile");
	});
});
