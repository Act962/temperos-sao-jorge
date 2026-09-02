import { beforeEach, describe, expect, it } from "vitest";
import { InvalidInputError, NotFoundError } from "../domain/errors";
import {
	chaveDePackshot,
	chaveDeReceita,
	comoChaveDeImagem,
	familiaDaChave,
	TAMANHO_MAXIMO,
	validarEnvio,
} from "../domain/image";
import {
	type FakeImageProcessor,
	type InMemoryImageStorage,
	servicosDeImagemEmMemoria,
} from "../testing/in-memory-image-storage";
import {
	exigirPackshotDaFamilia,
	guardarFotoDeReceita,
	guardarPackshot,
	listarPackshotsDaFamilia,
	removerImagem,
} from "./images";

/**
 * Tudo aqui roda sem rede e sem credencial: o bucket é um Map.
 *
 * O adaptador do R2 é exercitado à parte, contra um serviço S3 de verdade —
 * veja `packages/media`.
 */
let servicos: {
	storage: InMemoryImageStorage;
	processor: FakeImageProcessor;
};

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);

beforeEach(() => {
	servicos = servicosDeImagemEmMemoria();
});

describe("chave de imagem", () => {
	it("deriva o packshot com a família no caminho", () => {
		expect(chaveDePackshot("chas", "sachet-melissa")).toBe(
			"products/chas/sachet-melissa.webp",
		);
	});

	it("é o caminho de hoje menos o prefixo /images/", () => {
		// A migração precisa ser uma transformação de string, não uma tabela
		// de-para: se isso deixar de valer, a fatia seguinte fica muito mais cara.
		const caminhoAtual = "/images/products/chas/sachet-melissa.webp";
		expect(`/images/${chaveDePackshot("chas", "sachet-melissa")}`).toBe(
			caminhoAtual,
		);
	});

	it("deriva a receita sem família", () => {
		expect(chaveDeReceita("arroz-a-grega")).toBe("recipes/arroz-a-grega.webp");
	});

	it("recusa chave fora do formato dizendo o esperado", () => {
		expect(() => comoChaveDeImagem("products/chas/foto.png")).toThrow(
			/Esperado/,
		);
		expect(() => comoChaveDeImagem("/products/chas/foto.webp")).toThrow(
			InvalidInputError,
		);
		// Pasta solta viraria lixo no bucket que ninguém sabe de onde veio.
		expect(() => comoChaveDeImagem("aleatorio/foto.webp")).toThrow(
			InvalidInputError,
		);
	});

	it("recusa slug com acento ou maiúscula, como no resto do domínio", () => {
		expect(() => chaveDePackshot("chás", "melissa")).toThrow(InvalidInputError);
		expect(() => chaveDePackshot("chas", "Melissa")).toThrow(InvalidInputError);
	});

	it("lê a família da própria chave, e só de packshot", () => {
		expect(familiaDaChave(chaveDePackshot("chas", "melissa"))).toBe("chas");
		expect(familiaDaChave(chaveDeReceita("arroz-a-grega"))).toBeNull();
	});
});

describe("validação do envio", () => {
	it("aceita os formatos que a marca entrega", () => {
		for (const contentType of ["image/png", "image/jpeg", "image/webp"]) {
			expect(() => validarEnvio({ contentType, tamanho: 1024 })).not.toThrow();
		}
	});

	it("ignora parâmetros do content-type", () => {
		// Navegador manda `image/jpeg; charset=binary` sem avisar.
		expect(() =>
			validarEnvio({ contentType: "image/jpeg; charset=binary", tamanho: 10 }),
		).not.toThrow();
	});

	it("recusa tipo não aceito", () => {
		expect(() =>
			validarEnvio({ contentType: "application/pdf", tamanho: 10 }),
		).toThrow(/não aceito/);
	});

	it("recusa arquivo vazio e arquivo grande demais", () => {
		expect(() =>
			validarEnvio({ contentType: "image/png", tamanho: 0 }),
		).toThrow(/vazio/);
		expect(() =>
			validarEnvio({ contentType: "image/png", tamanho: TAMANHO_MAXIMO + 1 }),
		).toThrow(/acima do limite/);
	});
});

describe("guardar packshot", () => {
	it("passa pelo processador e grava sempre como WebP", async () => {
		const guardada = await guardarPackshot(servicos, {
			familySlug: "chas",
			slug: "sachet-melissa",
			contentType: "image/png",
			corpo: PNG,
		});

		expect(servicos.processor.chamadas).toBe(1);
		// A chave promete WebP; guardar o original quebraria a promessa.
		expect(guardada.contentType).toBe("image/webp");
		expect(guardada.key).toBe("products/chas/sachet-melissa.webp");
		expect(guardada.tamanho).toBeGreaterThan(PNG.length);
	});

	it("recusa antes de tocar no armazenamento", async () => {
		await expect(
			guardarPackshot(servicos, {
				familySlug: "chas",
				slug: "sachet-melissa",
				contentType: "application/pdf",
				corpo: PNG,
			}),
		).rejects.toThrow(InvalidInputError);

		// Nem processou, nem gravou: o custo de rede não chegou a existir.
		expect(servicos.processor.chamadas).toBe(0);
		expect(await servicos.storage.listar("products/")).toEqual([]);
	});

	it("guarda foto de receita fora da árvore de produtos", async () => {
		const guardada = await guardarFotoDeReceita(servicos, {
			slug: "arroz-a-grega",
			contentType: "image/jpeg",
			corpo: PNG,
		});
		expect(guardada.key).toBe("recipes/arroz-a-grega.webp");
	});
});

describe("packshot na pasta da família", () => {
	beforeEach(async () => {
		await guardarPackshot(servicos, {
			familySlug: "chas",
			slug: "sachet-melissa",
			contentType: "image/png",
			corpo: PNG,
		});
	});

	it("aceita quando a pasta bate", async () => {
		const key = chaveDePackshot("chas", "sachet-melissa");
		await expect(
			exigirPackshotDaFamilia(servicos.storage, key, "chas"),
		).resolves.toMatchObject({ key });
	});

	it("recusa quando o produto mudou de família e a foto ficou", async () => {
		const key = chaveDePackshot("chas", "sachet-melissa");
		await expect(
			exigirPackshotDaFamilia(servicos.storage, key, "ervas-e-especiarias"),
		).rejects.toThrow(/pasta de outra família/);
	});

	it("recusa chave que nem é de packshot", async () => {
		await expect(
			exigirPackshotDaFamilia(
				servicos.storage,
				chaveDeReceita("arroz-a-grega"),
				"chas",
			),
		).rejects.toThrow(/não é a chave de um packshot/);
	});

	it("falha quando a chave está certa mas o arquivo não existe", async () => {
		await expect(
			exigirPackshotDaFamilia(
				servicos.storage,
				chaveDePackshot("chas", "sachet-boldo"),
				"chas",
			),
		).rejects.toThrow(NotFoundError);
	});
});

describe("listar e remover", () => {
	beforeEach(async () => {
		for (const [familia, slug] of [
			["chas", "sachet-melissa"],
			["chas", "sachet-boldo"],
			["temperos-em-po", "paprica-doce"],
		] as const) {
			await guardarPackshot(servicos, {
				familySlug: familia,
				slug,
				contentType: "image/png",
				corpo: PNG,
			});
		}
	});

	it("lista só a família pedida", async () => {
		const chas = await listarPackshotsDaFamilia(servicos.storage, "chas");
		expect(chas.sort()).toEqual([
			"products/chas/sachet-boldo.webp",
			"products/chas/sachet-melissa.webp",
		]);
	});

	it("remove o que existe", async () => {
		const key = chaveDePackshot("chas", "sachet-boldo");
		await removerImagem(servicos.storage, key);
		expect(await servicos.storage.descrever(key)).toBeNull();
	});

	it("falha ao remover o que não existe, em vez de fingir sucesso", async () => {
		await expect(
			removerImagem(servicos.storage, chaveDePackshot("chas", "fantasma")),
		).rejects.toThrow(NotFoundError);
	});
});
