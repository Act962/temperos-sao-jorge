import { beforeEach, describe, expect, it } from "vitest";
import { InvalidInputError } from "../domain/errors";
import {
	chaveDePackshot,
	chaveDeReceita,
	ehChaveDeImagem,
	urlDaImagem,
} from "../domain/image";
import { criarFamilia, criarProduto } from "../domain/product";
import { criarReceita } from "../domain/recipe";
import type { CatalogRepositories } from "../ports/catalog-repository";
import {
	type FakeImageProcessor,
	type InMemoryImageStorage,
	servicosDeImagemEmMemoria,
} from "../testing/in-memory-image-storage";
import { repositoriosEmMemoria } from "../testing/in-memory-repositories";
import {
	descartarFotoSubstituida,
	guardarFotoDeReceita,
	guardarPackshot,
	novaVersaoDeImagem,
} from "./images";
import { atualizarProduto } from "./products";
import { montarCatalogoPublicado } from "./published-catalog";

/**
 * As regras do envio de fotos pelo painel (spec 0010), sem rede: o bucket é um
 * Map e o processador só marca por onde passou.
 */
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);
const BASE = "https://imagens.exemplo";

const receita = (image: string | null) =>
	criarReceita({
		slug: "arroz-a-grega",
		name: "Arroz à Grega",
		summary: "",
		minutes: 30,
		level: "Fácil",
		servings: 4,
		category: "Almoço",
		image,
		ingredients: ["2 xícaras de arroz"],
		steps: ["Cozinhe o arroz."],
	});

describe("versão na chave", () => {
	it("entra depois do slug e continua sendo uma chave válida", () => {
		const chave = chaveDePackshot("chas", "sachet-melissa", "m3k9x2");
		expect(chave).toBe("products/chas/sachet-melissa-m3k9x2.webp");
		expect(ehChaveDeImagem(chave)).toBe(true);

		expect(chaveDeReceita("arroz-a-grega", "m3k9x2")).toBe(
			"recipes/arroz-a-grega-m3k9x2.webp",
		);
	});

	it("recusa versão que quebraria o formato da chave", () => {
		expect(() => chaveDePackshot("chas", "sachet-melissa", "V-2")).toThrow(
			InvalidInputError,
		);
	});

	it("uma versão gerada serve de chave, e duas seguidas diferem", () => {
		const uma = novaVersaoDeImagem(1_700_000_000_000);
		const outra = novaVersaoDeImagem(1_700_000_000_001);

		expect(uma).not.toBe(outra);
		expect(ehChaveDeImagem(chaveDePackshot("chas", "boldo", uma))).toBe(true);
	});
});

describe("endereço da foto", () => {
	it("caminho antigo sai como está, com ou sem bucket", () => {
		const caminho = "/images/products/chas/sachet-melissa.webp";
		expect(urlDaImagem(caminho, BASE)).toBe(caminho);
		expect(urlDaImagem(caminho, null)).toBe(caminho);
	});

	it("chave vira endereço do bucket, sem barra dobrada", () => {
		expect(urlDaImagem("products/chas/boldo-m3k9x2.webp", `${BASE}/`)).toBe(
			`${BASE}/products/chas/boldo-m3k9x2.webp`,
		);
	});

	it("chave sem bucket configurado vira vazio, não um endereço quebrado", () => {
		expect(urlDaImagem("products/chas/boldo-m3k9x2.webp", null)).toBe("");
	});

	it("sem foto, ou com valor que não é nenhum dos dois, vira vazio", () => {
		expect(urlDaImagem(null, BASE)).toBe("");
		expect(urlDaImagem("", BASE)).toBe("");
		expect(urlDaImagem("https://outro.site/foto.webp", BASE)).toBe("");
	});
});

describe("o campo image aceita os dois mundos", () => {
	it("produto aceita chave do bucket", () => {
		const produto = criarProduto({
			slug: "boldo",
			name: "Boldo",
			familySlug: "chas",
			image: "products/chas/boldo-m3k9x2.webp",
		});
		expect(produto.image).toBe("products/chas/boldo-m3k9x2.webp");
	});

	it("produto recusa chave de receita e endereço solto", () => {
		for (const image of [
			"recipes/arroz-a-grega.webp",
			"https://outro.site/foto.webp",
			"products/chas/boldo.png",
		]) {
			expect(() =>
				criarProduto({
					slug: "boldo",
					name: "Boldo",
					familySlug: "chas",
					image,
				}),
			).toThrow(InvalidInputError);
		}
	});

	it("caminho antigo continua preso à pasta da família", () => {
		expect(() =>
			criarProduto({
				slug: "boldo",
				name: "Boldo",
				familySlug: "chas",
				image: "/images/products/temperos-em-po/boldo.webp",
			}),
		).toThrow(/outra família/);
	});

	it("receita aceita caminho antigo e chave de receita, e recusa o resto", () => {
		expect(receita("/images/recipes/arroz-a-grega.jpg").image).toBe(
			"/images/recipes/arroz-a-grega.jpg",
		);
		expect(receita("recipes/arroz-a-grega-m3k9x2.webp").image).toBe(
			"recipes/arroz-a-grega-m3k9x2.webp",
		);
		expect(() => receita("products/chas/boldo.webp")).toThrow(
			InvalidInputError,
		);
	});
});

describe("produto com foto do bucket", () => {
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
					slug: "boldo",
					name: "Boldo",
					familySlug: "chas",
					image: "products/chas/boldo-m3k9x2.webp",
				}),
				criarProduto({
					slug: "camomila",
					name: "Camomila",
					familySlug: "chas",
					image: "/images/products/chas/sachet-camomila.webp",
					position: 1,
				}),
			],
		});
	});

	it("muda de família sem perder a foto", async () => {
		const mudado = await atualizarProduto(repos.products, "boldo", {
			familySlug: "temperos-em-po",
		});

		expect(mudado.familySlug).toBe("temperos-em-po");
		expect(mudado.image).toBe("products/chas/boldo-m3k9x2.webp");
	});

	it("o catálogo publicado entrega o endereço do bucket e mantém o caminho antigo", async () => {
		const { products } = await montarCatalogoPublicado(repos, {
			baseDasImagens: BASE,
		});

		const porSlug = new Map(products.map((p) => [p.slug, p.image]));
		expect(porSlug.get("boldo")).toBe(
			`${BASE}/products/chas/boldo-m3k9x2.webp`,
		);
		expect(porSlug.get("camomila")).toBe(
			"/images/products/chas/sachet-camomila.webp",
		);
	});

	it("sem bucket, o catálogo sai sem a foto em vez de com endereço quebrado", async () => {
		const { products } = await montarCatalogoPublicado(repos);
		expect(products.find((p) => p.slug === "boldo")?.image).toBe("");
	});
});

describe("envio e descarte", () => {
	let servicos: {
		storage: InMemoryImageStorage;
		processor: FakeImageProcessor;
	};

	beforeEach(() => {
		servicos = servicosDeImagemEmMemoria();
	});

	it("dois envios do mesmo produto ficam em endereços diferentes", async () => {
		const envio = {
			familySlug: "chas",
			slug: "boldo",
			contentType: "image/png",
			corpo: PNG,
		};
		const primeira = await guardarPackshot(servicos, {
			...envio,
			versao: "a1",
		});
		const segunda = await guardarPackshot(servicos, { ...envio, versao: "b2" });

		expect(primeira.key).not.toBe(segunda.key);
		expect(await servicos.storage.listar("products/chas/")).toHaveLength(2);
	});

	it("foto de receita passa pelo tratamento de foto, não pelo de packshot", async () => {
		const guardada = await guardarFotoDeReceita(servicos, {
			slug: "arroz-a-grega",
			contentType: "image/jpeg",
			corpo: PNG,
			versao: "a1",
		});

		const corpo = await servicos.storage.baixar(guardada.key);
		// "FOTO" é a marca do tratamento de receita no processador de teste.
		expect(String.fromCharCode(...(corpo?.slice(0, 4) ?? []))).toBe("FOTO");
	});

	it("apaga a foto anterior quando ela foi trocada", async () => {
		const antiga = await guardarPackshot(servicos, {
			familySlug: "chas",
			slug: "boldo",
			contentType: "image/png",
			corpo: PNG,
			versao: "a1",
		});

		const apagada = await descartarFotoSubstituida(
			servicos.storage,
			antiga.key,
			"products/chas/boldo-b2.webp",
		);

		expect(apagada).toBe(antiga.key);
		expect(await servicos.storage.descrever(antiga.key)).toBeNull();
	});

	it("apaga também quando a foto foi removida do produto", async () => {
		const antiga = await guardarPackshot(servicos, {
			familySlug: "chas",
			slug: "boldo",
			contentType: "image/png",
			corpo: PNG,
			versao: "a1",
		});

		await descartarFotoSubstituida(servicos.storage, antiga.key, null);
		expect(await servicos.storage.descrever(antiga.key)).toBeNull();
	});

	it("não apaga a foto que continua em uso", async () => {
		const atual = await guardarPackshot(servicos, {
			familySlug: "chas",
			slug: "boldo",
			contentType: "image/png",
			corpo: PNG,
			versao: "a1",
		});

		expect(
			await descartarFotoSubstituida(servicos.storage, atual.key, atual.key),
		).toBeNull();
		expect(await servicos.storage.descrever(atual.key)).not.toBeNull();
	});

	it("não toca no bucket quando o valor anterior era caminho antigo", async () => {
		expect(
			await descartarFotoSubstituida(
				servicos.storage,
				"/images/products/chas/sachet-camomila.webp",
				"products/chas/camomila-a1.webp",
			),
		).toBeNull();
	});
});
