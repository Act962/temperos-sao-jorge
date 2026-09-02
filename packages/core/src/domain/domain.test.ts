import { describe, expect, it } from "vitest";
import { InvalidInputError } from "./errors";
import { criarFamilia, criarProduto } from "./product";
import { criarReceita, duracaoIso, formatarDuracao } from "./recipe";
import { comoSlug, ehSlug, paraSlug } from "./slug";

describe("Slug", () => {
	it("aceita minúsculas, números e hífen simples", () => {
		for (const valor of ["chas", "temperos-em-po", "molho-de-alho-500-ml"]) {
			expect(ehSlug(valor)).toBe(true);
		}
	});

	it("recusa acento, maiúscula, espaço e hífen duplicado", () => {
		for (const valor of ["Chás", "temperos em po", "a--b", "-x", "x-", ""]) {
			expect(ehSlug(valor)).toBe(false);
			expect(() => comoSlug(valor)).toThrow(InvalidInputError);
		}
	});

	it("deriva slug de texto livre", () => {
		expect(paraSlug("Páprica Defumada 1 kg")).toBe("paprica-defumada-1-kg");
		expect(paraSlug("Chá Rins e Bexiga")).toBe("cha-rins-e-bexiga");
	});

	it("falha quando não sobra nada para derivar", () => {
		expect(() => paraSlug("!!!")).toThrow(InvalidInputError);
	});
});

describe("criarProduto", () => {
	const base = {
		slug: "camomila",
		name: "Camomila",
		familySlug: "chas",
		image: "/images/products/chas/sachet-camomila.webp",
	};

	it("constrói um produto válido", () => {
		const produto = criarProduto(base);
		expect(produto.slug).toBe("camomila");
		expect(produto.position).toBe(0);
	});

	it("aceita produto sem packshot", () => {
		expect(criarProduto({ ...base, image: null }).image).toBeNull();
	});

	it("recusa nome vazio", () => {
		expect(() => criarProduto({ ...base, name: "   " })).toThrow(
			InvalidInputError,
		);
	});

	it("recusa caminho de packshot fora do padrão do pipeline", () => {
		// Divergir aqui não quebra o build: o site só mostra um placeholder, o que
		// passa despercebido.
		for (const image of [
			"/images/camomila.webp",
			"/images/products/chas/sachet-camomila.png",
			"https://cdn.exemplo.com/a.webp",
		]) {
			expect(() => criarProduto({ ...base, image })).toThrow(InvalidInputError);
		}
	});

	it("recusa packshot guardado na pasta de outra família", () => {
		expect(() =>
			criarProduto({
				...base,
				image: "/images/products/temperos-em-po/sachet-camomila.webp",
			}),
		).toThrow(/outra família/);
	});
});

describe("criarFamilia", () => {
	it("recusa nome vazio", () => {
		expect(() => criarFamilia({ slug: "chas", name: " " })).toThrow(
			InvalidInputError,
		);
	});
});

describe("duração da receita", () => {
	it("formata para leitura", () => {
		expect(formatarDuracao(30)).toBe("30 min");
		expect(formatarDuracao(80)).toBe("1 h 20 min");
		expect(formatarDuracao(120)).toBe("2 h");
	});

	it("converte para ISO 8601", () => {
		expect(duracaoIso(30)).toBe("PT30M");
		expect(duracaoIso(80)).toBe("PT1H20M");
		expect(duracaoIso(120)).toBe("PT2H");
	});

	it("mantém as duas leituras coerentes por construção", () => {
		// O texto exibido e o valor dos filtros derivam do mesmo campo, então não
		// há como desincronizarem — que era o risco dos dois campos separados.
		for (const minutos of [15, 30, 45, 80, 90, 120]) {
			expect(formatarDuracao(minutos)).toContain(
				minutos >= 60 ? `${Math.floor(minutos / 60)} h` : `${minutos} min`,
			);
		}
	});
});

describe("criarReceita", () => {
	const base = {
		slug: "arroz-a-grega",
		name: "Arroz à Grega",
		summary: "Colorido e leve.",
		minutes: 40,
		level: "Fácil" as const,
		servings: 6,
		category: "Almoço" as const,
		ingredients: ["2 xícaras de arroz"],
		steps: ["Refogue o arroz."],
	};

	it("constrói uma receita válida", () => {
		expect(criarReceita(base).minutes).toBe(40);
	});

	it("recusa duração e porções não positivas ou fracionárias", () => {
		for (const patch of [
			{ minutes: 0 },
			{ minutes: -5 },
			{ minutes: 12.5 },
			{ servings: 0 },
		]) {
			expect(() => criarReceita({ ...base, ...patch })).toThrow(
				InvalidInputError,
			);
		}
	});

	it("exige ingredientes e passos", () => {
		expect(() => criarReceita({ ...base, ingredients: [] })).toThrow(
			InvalidInputError,
		);
		expect(() => criarReceita({ ...base, steps: [] })).toThrow(
			InvalidInputError,
		);
	});

	it("valida o slug dos produtos citados", () => {
		expect(() =>
			criarReceita({ ...base, usedProductSlugs: ["Alho Triturado"] }),
		).toThrow(InvalidInputError);
	});
});
