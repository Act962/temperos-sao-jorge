#!/usr/bin/env node
/**
 * Converts the raw product photography into web-ready packshots.
 *
 * The originals are ~5000x5000 RGBA PNGs of 3-9 MB each — roughly 750 MB for
 * the full catalogue, for tiles that never render wider than ~260 CSS px.
 * This resizes them to 600 px and encodes lossy WebP with the alpha channel
 * intact, which is about 1% of the original weight.
 *
 * Usage:
 *   node scripts/optimize-product-images.mjs <pasta-de-origem> [--dry-run]
 *
 * The source folder is the FAMILIAS tree exported from the design project:
 *   FAMILIAS/CHÁS/Sachet camomila.png -> public/images/products/chas/sachet-camomila.webp
 *
 * Destination names must match `image` in apps/web/src/data/products.ts; the
 * script fails loudly if the two ever drift apart.
 */

import { mkdir, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WEB = path.join(ROOT, "apps/web");
const OUT_DIR = path.join(WEB, "public/images/products");

/** Longest edge, in pixels. Covers a 260 px tile at 2x device pixel ratio. */
const MAX_SIZE = 600;
/**
 * Margem transparente uniforme em volta do produto já recortado.
 * Os arquivos originais trazem ~73% de área vazia, o que fazia o sachê
 * renderizar a ~89 px numa caixa de 150 px. Recortar e repadronizar a margem
 * deixa todos os produtos no mesmo enquadramento e quase dobra o tamanho
 * aparente sem mudar uma linha de CSS.
 */
const PADDING = 22;
const WEBP_QUALITY = 82;

const FOLDER_TO_FAMILY = {
	CHÁS: "chas",
	"ERVAS E ESPECIARIAS": "ervas-e-especiarias",
	"FARINHAS NATURAIS": "farinhas-naturais",
	INSTITUCIONAL: "institucional",
	"MOLHOS E PASTAS": "molhos-e-pastas",
	"SEMENTES E GRÃOS NATURAIS": "sementes-e-graos-naturais",
	"TEMPEROS EM PÓ": "temperos-em-po",
	"TEMPEROS LIQUIDOS PRONTOS": "temperos-liquidos-prontos",
};

function slugify(value) {
	return value
		.toLowerCase()
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

async function expectedImages() {
	const source = await readFile(path.join(WEB, "src/data/products.ts"), "utf8");
	const match = source.match(
		/export const PRODUCTS[^=]+= (\[[\s\S]*?\n\]) as const;/,
	);
	if (!match)
		throw new Error(
			"Não consegui ler PRODUCTS de apps/web/src/data/products.ts",
		);
	const products = new Function(`return ${match[1]}`)();
	return new Map(products.map((product) => [product.image, product.name]));
}

async function collectSources(sourceDir) {
	const jobs = [];
	const unknown = [];

	for (const folder of await readdir(sourceDir)) {
		const familySlug = FOLDER_TO_FAMILY[folder];
		if (!familySlug) {
			unknown.push(folder);
			continue;
		}
		for (const file of await readdir(path.join(sourceDir, folder))) {
			if (!/\.(png|jpe?g|webp|tiff?)$/i.test(file)) continue;
			const base = slugify(path.basename(file, path.extname(file)));
			jobs.push({
				from: path.join(sourceDir, folder, file),
				to: path.join(OUT_DIR, familySlug, `${base}.webp`),
				publicPath: `/images/products/${familySlug}/${base}.webp`,
			});
		}
	}

	return { jobs, unknown };
}

async function main() {
	const [sourceDir, ...flags] = process.argv.slice(2);
	if (!sourceDir) {
		console.error(
			"uso: node scripts/optimize-product-images.mjs <pasta-de-origem> [--dry-run]",
		);
		process.exit(1);
	}
	const dryRun = flags.includes("--dry-run");

	const expected = await expectedImages();
	const { jobs, unknown } = await collectSources(path.resolve(sourceDir));

	const produced = new Set(jobs.map((job) => job.publicPath));
	const missing = [...expected.keys()].filter((image) => !produced.has(image));
	const extra = jobs.filter((job) => !expected.has(job.publicPath));

	console.log(`origem   : ${jobs.length} arquivos`);
	console.log(`catálogo : ${expected.size} imagens esperadas`);
	if (unknown.length) console.log(`pastas ignoradas: ${unknown.join(", ")}`);
	for (const image of missing)
		console.log(`  SEM ORIGEM  ${image} (${expected.get(image)})`);
	for (const job of extra)
		console.log(`  SEM DESTINO ${path.basename(job.from)}`);

	if (missing.length || extra.length) {
		console.error("\nOrigem e catálogo divergem — nada foi gravado.");
		process.exit(1);
	}
	if (dryRun) {
		console.log("\n(dry-run — nada gravado)");
		return;
	}

	let inputBytes = 0;
	let outputBytes = 0;

	const inner = MAX_SIZE - PADDING * 2;
	const transparent = { r: 0, g: 0, b: 0, alpha: 0 };

	for (const job of jobs) {
		await mkdir(path.dirname(job.to), { recursive: true });
		await sharp(job.from)
			// Descarta a moldura transparente do arquivo original...
			.trim({ background: transparent, threshold: 10 })
			// ...encaixa o produto no maior tamanho possível...
			.resize(inner, inner, {
				fit: "inside",
				withoutEnlargement: true,
				background: transparent,
			})
			// ...e devolve a margem, agora igual para todos os produtos.
			.extend({
				top: PADDING,
				bottom: PADDING,
				left: PADDING,
				right: PADDING,
				background: transparent,
			})
			.webp({ quality: WEBP_QUALITY, alphaQuality: 100, effort: 6 })
			.toFile(job.to);

		inputBytes += (await stat(job.from)).size;
		outputBytes += (await stat(job.to)).size;
	}

	const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1);
	console.log(
		`\n${jobs.length} imagens: ${mb(inputBytes)} MB -> ${mb(outputBytes)} MB ` +
			`(${((1 - outputBytes / inputBytes) * 100).toFixed(1)}% menor)`,
	);
}

await main();
