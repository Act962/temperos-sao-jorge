import type { ImageProcessor } from "@my-better-t-app/core";
import { PACKSHOT } from "@my-better-t-app/core";
import sharp from "sharp";

/**
 * Tratamento do packshot com `sharp`.
 *
 * Os números vêm do domínio (`PACKSHOT`); aqui só se executa. É por isso que
 * `sharp` — binário nativo, que não roda em qualquer runtime — fica atrás de
 * uma porta em vez de ser importado pelo caso de uso.
 *
 * A sequência é a mesma que o script `optimize-product-images.mjs` já usava e
 * que foi afinada contra o acervo real: recortar a moldura transparente,
 * redimensionar o que sobrou e devolver uma margem uniforme. Sem o recorte, os
 * originais entregam ~73% de área vazia e o sachê renderiza pequeno demais
 * dentro da peça.
 */
export class SharpImageProcessor implements ImageProcessor {
	async paraPackshot(original: Uint8Array): Promise<Uint8Array> {
		const interno = PACKSHOT.maiorAresta - PACKSHOT.margem * 2;
		const transparente = { r: 0, g: 0, b: 0, alpha: 0 };

		const saida = await sharp(original)
			.trim({ background: transparente, threshold: 10 })
			.resize(interno, interno, {
				fit: "inside",
				withoutEnlargement: true,
				background: transparente,
			})
			.extend({
				top: PACKSHOT.margem,
				bottom: PACKSHOT.margem,
				left: PACKSHOT.margem,
				right: PACKSHOT.margem,
				background: transparente,
			})
			.webp({
				quality: PACKSHOT.qualidadeWebp,
				alphaQuality: 100,
				effort: 6,
			})
			.toBuffer();

		return new Uint8Array(saida);
	}
}
