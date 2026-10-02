import { describe, expect, it } from "vitest";
import { filtrarPorTermo, semAcento } from "@/components/admin/filtro";

const PRODUTOS = [
	{ name: "Chá Verde" },
	{ name: "Páprica Doce" },
	{ name: "Semente de Chia" },
	{ name: "Orégano" },
];

const nomes = (termo: string) =>
	filtrarPorTermo(PRODUTOS, termo, (p) => p.name).map((p) => p.name);

describe("busca das listagens", () => {
	it("ignora acento no nome", () => {
		expect(nomes("cha")).toEqual(["Chá Verde"]);
	});

	it("ignora acento e caixa no termo", () => {
		expect(nomes("PÁPRICA")).toEqual(["Páprica Doce"]);
		expect(nomes("oregano")).toEqual(["Orégano"]);
	});

	it("casa no meio do nome", () => {
		expect(nomes("chia")).toEqual(["Semente de Chia"]);
	});

	it("não filtra com termo vazio ou só de espaços", () => {
		expect(nomes("")).toHaveLength(PRODUTOS.length);
		expect(nomes("   ")).toHaveLength(PRODUTOS.length);
	});

	it("devolve vazio quando nada casa", () => {
		expect(nomes("canela")).toEqual([]);
	});

	it("normaliza sem perder as letras", () => {
		expect(semAcento("  Açúcar & Pimentão  ")).toBe("acucar & pimentao");
	});
});
