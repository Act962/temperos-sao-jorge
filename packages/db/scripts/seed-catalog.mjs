#!/usr/bin/env node
/**
 * Leva o catálogo dos arquivos TS para o Postgres — uma vez só.
 *
 * A fonte é o que o site usa hoje (`apps/web/src/data/*.ts`), então o banco
 * nasce exatamente igual ao que está no ar. Depois desta carga o admin passa a
 * ser a fonte da verdade, e `publish-catalog.mjs` faz o caminho de volta.
 *
 * Uso:
 *   pnpm run catalog:seed [-- --dry-run]
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";

const ROOT = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../../..",
);
const DATA = path.join(ROOT, "apps/web/src/data");

/** Lê um array exportado de um módulo TS sem compilar o projeto inteiro. */
async function lerArray(arquivo, exportName) {
	const fonte = await readFile(path.join(DATA, arquivo), "utf8");
	const re = new RegExp(
		`export const ${exportName}[^=]*=\\s*(\\[[\\s\\S]*?\\n\\])\\s*(?:as const)?;`,
	);
	const match = fonte.match(re);
	if (!match) throw new Error(`Não achei ${exportName} em ${arquivo}`);
	return new Function(`return ${match[1]}`)();
}

/** Os documentos de conteúdo da reserva, como linhas da tabela. */
async function lerConteudo() {
	const fonte = await readFile(path.join(DATA, "content.ts"), "utf8");
	const match = fonte.match(
		/export const PUBLISHED_CONTENT[^=]*=\s*(\{[\s\S]*\})\s*;/,
	);
	if (!match) throw new Error("Não achei PUBLISHED_CONTENT em content.ts");
	const documentos = new Function(`return ${match[1]}`)();
	return Object.entries(documentos).map(([key, data]) => ({ key, data }));
}

async function main() {
	const dryRun = process.argv.includes("--dry-run");
	const url = process.env.DATABASE_URL;
	if (!url) {
		console.error("Defina DATABASE_URL.");
		process.exit(1);
	}

	const familias = await lerArray("products.ts", "PRODUCT_FAMILIES");
	const produtos = await lerArray("products.ts", "PRODUCTS");
	const receitas = await lerArray("recipes.ts", "RECIPES");
	const conteudo = await lerConteudo();

	console.log(
		`origem: ${familias.length} famílias, ${produtos.length} produtos, ${receitas.length} receitas, ${conteudo.length} documentos de conteúdo`,
	);

	if (dryRun) {
		console.log("(dry-run — nada gravado)");
		return;
	}

	const { productFamily, product, recipe, recipeProduct } = await import(
		"../src/schema/catalog.ts"
	);
	const { siteContent } = await import("../src/schema/content.ts");
	const db = drizzle(url);

	await db.transaction(async (tx) => {
		// Recarga idempotente: rodar duas vezes deixa o mesmo estado.
		await tx.delete(recipeProduct);
		await tx.delete(recipe);
		await tx.delete(product);
		await tx.delete(productFamily);

		await tx.insert(productFamily).values(
			familias.map((f, position) => ({
				slug: f.slug,
				name: f.name,
				position,
			})),
		);

		await tx.insert(product).values(
			produtos.map((p, position) => ({
				slug: p.slug,
				name: p.name,
				familySlug: p.familySlug,
				image: p.image ?? null,
				position,
			})),
		);

		await tx.insert(recipe).values(
			receitas.map((r) => ({
				slug: r.slug,
				name: r.name,
				summary: r.summary,
				minutes: r.minutes,
				level: r.level,
				servings: r.servings,
				category: r.category,
				image: r.image ?? null,
				ingredients: r.ingredients,
				steps: r.steps,
			})),
		);

		const vinculos = receitas.flatMap((r) =>
			(r.usedProductSlugs ?? []).map((productSlug, position) => ({
				recipeSlug: r.slug,
				productSlug,
				position,
			})),
		);
		if (vinculos.length > 0) await tx.insert(recipeProduct).values(vinculos);

		// O conteúdo editável volta ao que a reserva guarda. Sem nenhum
		// documento publicado a tabela fica vazia, e o site mostra o padrão.
		await tx.delete(siteContent);
		if (conteudo.length > 0) await tx.insert(siteContent).values(conteudo);
	});

	console.log("catálogo carregado no Postgres");
	process.exit(0);
}

await main();
