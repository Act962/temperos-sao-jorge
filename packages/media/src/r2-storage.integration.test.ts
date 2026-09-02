import { CreateBucketCommand, S3Client } from "@aws-sdk/client-s3";
import {
	chaveDePackshot,
	chaveDeReceita,
	guardarPackshot,
	listarPackshotsDaFamilia,
	removerImagem,
} from "@my-better-t-app/core";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { configuracaoDoAmbiente, R2ImageStorage } from "./r2-storage";
import { SharpImageProcessor } from "./sharp-processor";

/**
 * O adaptador contra um serviço compatível com S3 de verdade.
 *
 * Sem credencial a suíte se pula, mesmo critério dos testes do Drizzle: nem o
 * CI nem quem só mexe no site precisam de bucket. Para rodar, sobe um MinIO
 * local e aponta o ambiente para ele — a API é a mesma do R2, e é justamente
 * por isso que o adaptador fala S3 puro:
 *
 *   docker run -d --name sj-minio -p 9000:9000 \
 *     -e MINIO_ROOT_USER=minio -e MINIO_ROOT_PASSWORD=minio123 \
 *     minio/minio server /data
 *
 *   R2_ENDPOINT=http://localhost:9000 R2_BUCKET=sao-jorge \
 *   R2_ACCESS_KEY_ID=minio R2_SECRET_ACCESS_KEY=minio123 \
 *   R2_PUBLIC_URL=http://localhost:9000/sao-jorge pnpm run test
 *
 * Contra o R2 mesmo, troque o endpoint por R2_ACCOUNT_ID.
 */
const config = configuracaoDoAmbiente();

/**
 * `skipIf` pula os casos, mas ainda executa o corpo do `describe` para
 * registrá-los — daí a configuração de faz de conta, que nunca chega a abrir
 * conexão. É o mesmo motivo do `url ?? ""` nos testes do Drizzle.
 */
const SEM_CREDENCIAL = {
	endpoint: "http://localhost:0",
	bucket: "sem-bucket",
	accessKeyId: "",
	secretAccessKey: "",
	urlPublica: "http://localhost:0/sem-bucket",
};

describe.skipIf(!config)("R2ImageStorage", () => {
	const storage = new R2ImageStorage(config ?? SEM_CREDENCIAL);
	const servicos = { storage, processor: new SharpImageProcessor() };
	const PNG = new Uint8Array([]);

	let original: Uint8Array;

	beforeAll(async () => {
		if (!config) return;

		const cliente = new S3Client({
			endpoint: config.endpoint,
			region: "auto",
			credentials: {
				accessKeyId: config.accessKeyId,
				secretAccessKey: config.secretAccessKey,
			},
			forcePathStyle: true,
		});

		try {
			await cliente.send(new CreateBucketCommand({ Bucket: config.bucket }));
		} catch {
			// Já existe, que é o caso normal da segunda rodada em diante.
		}

		const sharp = (await import("sharp")).default;
		original = new Uint8Array(
			await sharp({
				create: {
					width: 1200,
					height: 1200,
					channels: 4,
					background: { r: 10, g: 120, b: 60, alpha: 1 },
				},
			})
				.png()
				.toBuffer(),
		);
	});

	async function limpar(prefixo: string) {
		for (const key of await storage.listar(prefixo)) {
			await storage.remover(key);
		}
	}

	beforeEach(async () => {
		await limpar("products/");
		await limpar("recipes/");
	});

	it("guarda e devolve o conteúdo e o tipo intactos", async () => {
		const guardada = await guardarPackshot(servicos, {
			familySlug: "chas",
			slug: "sachet-melissa",
			contentType: "image/png",
			corpo: original,
		});

		expect(guardada.key).toBe("products/chas/sachet-melissa.webp");

		const descrita = await storage.descrever(guardada.key);
		expect(descrita?.contentType).toBe("image/webp");
		expect(descrita?.tamanho).toBe(guardada.tamanho);

		const baixada = await storage.baixar(guardada.key);
		expect(baixada?.length).toBe(guardada.tamanho);
		// Assinatura RIFF/WEBP: o que subiu foi mesmo o arquivo tratado.
		expect(new TextDecoder().decode(baixada?.slice(0, 4))).toBe("RIFF");
	});

	it("devolve null para chave que não existe, em vez de estourar", async () => {
		// É o que separa "sem foto ainda" de "o bucket caiu", e o caso de uso
		// depende dessa diferença para dar a mensagem certa.
		expect(await storage.descrever(chaveDePackshot("chas", "fantasma"))).toBe(
			null,
		);
		expect(await storage.baixar(chaveDePackshot("chas", "fantasma"))).toBe(
			null,
		);
	});

	it("lista por prefixo, sem misturar famílias nem receitas", async () => {
		for (const [familia, slug] of [
			["chas", "sachet-melissa"],
			["chas", "sachet-boldo"],
			["temperos-em-po", "paprica-doce"],
		] as const) {
			await guardarPackshot(servicos, {
				familySlug: familia,
				slug,
				contentType: "image/png",
				corpo: original,
			});
		}
		await storage.guardar(
			chaveDeReceita("arroz-a-grega"),
			original,
			"image/png",
		);

		const chas = await listarPackshotsDaFamilia(storage, "chas");
		expect(chas.sort()).toEqual([
			"products/chas/sachet-boldo.webp",
			"products/chas/sachet-melissa.webp",
		]);
	});

	it("remove de verdade", async () => {
		const guardada = await guardarPackshot(servicos, {
			familySlug: "chas",
			slug: "sachet-melissa",
			contentType: "image/png",
			corpo: original,
		});

		await removerImagem(storage, guardada.key);
		expect(await storage.descrever(guardada.key)).toBe(null);
	});

	it("monta a URL pública juntando a base com a chave", () => {
		expect(storage.urlPublica(chaveDePackshot("chas", "sachet-melissa"))).toBe(
			`${config?.urlPublica.replace(/\/+$/, "")}/products/chas/sachet-melissa.webp`,
		);
	});

	it("recusa envio inválido antes de tocar na rede", async () => {
		await expect(
			guardarPackshot(servicos, {
				familySlug: "chas",
				slug: "sachet-melissa",
				contentType: "application/pdf",
				corpo: PNG,
			}),
		).rejects.toThrow(/não aceito/);
	});
});
