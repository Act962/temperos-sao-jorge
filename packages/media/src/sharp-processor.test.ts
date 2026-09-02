import { PACKSHOT } from "@my-better-t-app/core";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { SharpImageProcessor } from "./sharp-processor";

/**
 * O tratamento de verdade, com `sharp` de verdade.
 *
 * Não precisa de rede nem de credencial: o que está sendo conferido é a
 * sequência recorte → redimensiona → margem, que é a parte que já custou caro
 * de acertar contra o acervo real.
 */
const processador = new SharpImageProcessor();

/** Um quadrado opaco pequeno no meio de muita transparência, como os originais. */
async function originalComMolduraVazia(
	lado = 2000,
	conteudo = 1400,
): Promise<Uint8Array> {
	const quadrado = await sharp({
		create: {
			width: conteudo,
			height: conteudo,
			channels: 4,
			background: { r: 200, g: 30, b: 40, alpha: 1 },
		},
	})
		.png()
		.toBuffer();

	const composto = await sharp({
		create: {
			width: lado,
			height: lado,
			channels: 4,
			background: { r: 0, g: 0, b: 0, alpha: 0 },
		},
	})
		.composite([
			{
				input: quadrado,
				top: Math.round((lado - conteudo) / 2),
				left: Math.round((lado - conteudo) / 2),
			},
		])
		.png()
		.toBuffer();

	return new Uint8Array(composto);
}

describe("SharpImageProcessor", () => {
	it("devolve WebP no enquadramento do domínio", async () => {
		const saida = await processador.paraPackshot(
			await originalComMolduraVazia(),
		);
		const meta = await sharp(saida).metadata();

		expect(meta.format).toBe("webp");
		expect(meta.width).toBe(PACKSHOT.maiorAresta);
		expect(meta.height).toBe(PACKSHOT.maiorAresta);
	});

	it("recorta a moldura transparente antes de redimensionar", async () => {
		// Sem o recorte, o conteúdo herdaria a moldura vazia do original e
		// sairia menor dentro da peça — a diferença entre o sachê parecer
		// grande ou perdido na caixa.
		const saida = await processador.paraPackshot(
			await originalComMolduraVazia(),
		);
		const { info, data } = await sharp(saida)
			.ensureAlpha()
			.raw()
			.toBuffer({ resolveWithObject: true });

		const opaco = (x: number, y: number) =>
			data[(y * info.width + x) * info.channels + 3] !== 0;

		const centro = Math.round(PACKSHOT.maiorAresta / 2);
		expect(opaco(centro, centro)).toBe(true);
		// Logo depois da margem já é conteúdo.
		expect(opaco(PACKSHOT.margem + 4, centro)).toBe(true);
		// E a margem em si continua vazia.
		expect(opaco(2, 2)).toBe(false);
	});

	it("não amplia original menor que o alvo", async () => {
		// Os originais da marca têm ~5000 px e sempre encolhem. Um arquivo já
		// pequeno é o caso em que ampliar só entregaria borrão em arquivo maior.
		const pequeno = await originalComMolduraVazia(120, 80);
		const meta = await sharp(
			await processador.paraPackshot(pequeno),
		).metadata();

		expect(meta.width).toBe(80 + PACKSHOT.margem * 2);
	});
});
