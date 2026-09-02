#!/usr/bin/env node
/**
 * Gera os ícones do site a partir do master da marca.
 *
 * O logotipo é 2:1, então um recorte quadrado cortaria a palavra. A solução é
 * encaixá-lo inteiro num campo creme: em tamanho de aba o que se reconhece é a
 * elipse vermelha, e a partir de ~48 px "São Jorge / Alimentos" já se lê.
 *
 * A tagline em arco ("Mais Sabor em sua Mesa") é descartada — some em qualquer
 * tamanho de favicon e só suja a composição.
 *
 * Uso:
 *   node scripts/generate-favicons.mjs
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "apps/web/assets-src/logo-sao-jorge.png");
const OUT = path.join(ROOT, "apps/web/public");

/** Fração da altura do master que contém a elipse, sem a tagline em arco. */
const ARTWORK_HEIGHT_RATIO = 0.76;
/** Largura do logotipo dentro do quadro de 512 px. */
const LOGO_WIDTH = 492;
const CREAM = "rgb(251,246,234)";

/** Monta o ícone de 512 px. `rounded` controla os cantos arredondados. */
async function buildIcon({ rounded }) {
	const { height } = await sharp(SRC).metadata();
	const artwork = await sharp(SRC)
		.extract({
			left: 0,
			top: 0,
			width: (await sharp(SRC).metadata()).width,
			height: Math.round(height * ARTWORK_HEIGHT_RATIO),
		})
		.resize({ width: LOGO_WIDTH })
		.toBuffer();

	const field = Buffer.from(
		`<svg width="512" height="512"><rect width="512" height="512"${
			rounded ? ' rx="96"' : ""
		} fill="${CREAM}"/></svg>`,
	);

	return sharp(field)
		.composite([{ input: artwork, gravity: "centre" }])
		.png()
		.toBuffer();
}

/** Empacota PNGs quadrados num .ico (formato aceito desde o Vista). */
function buildIco(pngs) {
	const header = Buffer.alloc(6);
	header.writeUInt16LE(0, 0); // reservado
	header.writeUInt16LE(1, 2); // 1 = ícone
	header.writeUInt16LE(pngs.length, 4);

	let offset = 6 + pngs.length * 16;
	const entries = pngs.map(({ size, data }) => {
		const entry = Buffer.alloc(16);
		entry.writeUInt8(size >= 256 ? 0 : size, 0); // largura (0 = 256)
		entry.writeUInt8(size >= 256 ? 0 : size, 1); // altura
		entry.writeUInt8(0, 2); // paleta
		entry.writeUInt8(0, 3); // reservado
		entry.writeUInt16LE(1, 4); // planos
		entry.writeUInt16LE(32, 6); // bits por pixel
		entry.writeUInt32LE(data.length, 8);
		entry.writeUInt32LE(offset, 12);
		offset += data.length;
		return entry;
	});

	return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

async function main() {
	await mkdir(OUT, { recursive: true });

	const rounded = await buildIcon({ rounded: true });
	// O iOS aplica a própria máscara, então o apple-touch vai sem cantos e sem alfa.
	const square = await buildIcon({ rounded: false });

	const outputs = [
		["favicon-32.png", await sharp(rounded).resize(32, 32).png().toBuffer()],
		["favicon-192.png", await sharp(rounded).resize(192, 192).png().toBuffer()],
		[
			"apple-touch-icon.png",
			await sharp(square)
				.resize(180, 180)
				.flatten({ background: CREAM })
				.png()
				.toBuffer(),
		],
	];

	const icoSizes = [16, 32, 48];
	const icoPngs = await Promise.all(
		icoSizes.map(async (size) => ({
			size,
			data: await sharp(rounded).resize(size, size).png().toBuffer(),
		})),
	);
	outputs.push(["favicon.ico", buildIco(icoPngs)]);

	for (const [name, data] of outputs) {
		await writeFile(path.join(OUT, name), data);
		console.log(
			`  ${name.padEnd(22)} ${(data.length / 1024).toFixed(1).padStart(5)} KB`,
		);
	}
}

await main();
