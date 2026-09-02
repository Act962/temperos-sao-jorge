#!/usr/bin/env node
/**
 * Publica o catálogo: lê o Postgres e regrava os módulos de dados do site.
 *
 * É o que torna a arquitetura escolhida possível — banco como fonte da verdade
 * para o admin, site público sem dependência de banco em execução. Depois de
 * rodar, `pnpm --filter web build` gera o site já com o conteúdo novo.
 *
 * Uso:
 *   pnpm run catalog:publish [-- --dry-run]
 */

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import {
	product,
	productFamily,
	recipe,
	recipeProduct,
} from "../src/schema/catalog.ts";

const ROOT = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../../..",
);
const DATA = path.join(ROOT, "apps/web/src/data");

const AVISO = `// Gerado por packages/db/scripts/publish-catalog.mjs — não edite à mão.
// A fonte da verdade é o Postgres; rode \`pnpm run catalog:publish\` para
// regravar este arquivo a partir do banco.
`;

const json = (valor) => JSON.stringify(valor, null, "\t").replace(/\n/g, "\n");

function moduloProdutos(familias, produtos) {
	const comContagem = familias.map((familia) => ({
		slug: familia.slug,
		name: familia.name,
		count: produtos.filter((p) => p.familySlug === familia.slug).length,
	}));

	return `${AVISO}
export interface ProductFamily {
	readonly slug: string;
	readonly name: string;
	readonly count: number;
}

export interface Product {
	readonly slug: string;
	readonly name: string;
	readonly familySlug: string;
	readonly family: string;
	readonly image: string;
}

export const PRODUCT_FAMILIES: readonly ProductFamily[] = ${json(comContagem)} as const;

export const PRODUCTS: readonly Product[] = ${json(produtos)} as const;

export function getFamilyBySlug(slug: string): ProductFamily | undefined {
	return PRODUCT_FAMILIES.find((family) => family.slug === slug);
}

export function getProductsByFamily(familySlug: string): readonly Product[] {
	return PRODUCTS.filter((product) => product.familySlug === familySlug);
}
`;
}

function moduloReceitas(receitas) {
	return `${AVISO}
export const RECIPE_CATEGORIES = ["Almoço", "Jantar", "Lanches", "Festas"] as const;

export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number];

export const RECIPE_FILTERS = [
	"Todas",
	"Almoço",
	"Jantar",
	"Lanches",
	"Festas",
	"Até 30 min",
	"+ 30 min",
] as const;

export type RecipeFilter = (typeof RECIPE_FILTERS)[number];

export interface Recipe {
	readonly slug: string;
	readonly name: string;
	readonly time: string;
	readonly minutes: number;
	readonly level: "Fácil" | "Média" | "Difícil";
	readonly servings: number;
	readonly category: RecipeCategory;
	readonly summary: string;
	readonly image: string;
	readonly ingredients: readonly string[];
	readonly steps: readonly string[];
	readonly usedProductSlugs: readonly string[];
}

export const RECIPES: readonly Recipe[] = ${json(receitas)};

export function getRecipeBySlug(slug: string): Recipe | undefined {
	return RECIPES.find((recipe) => recipe.slug === slug);
}

export function filterRecipes(
	recipes: readonly Recipe[],
	filter: RecipeFilter,
): readonly Recipe[] {
	if (filter === "Todas") return recipes;
	if (filter === "Até 30 min") return recipes.filter((recipe) => recipe.minutes <= 30);
	if (filter === "+ 30 min") return recipes.filter((recipe) => recipe.minutes > 30);
	return recipes.filter((recipe) => recipe.category === filter);
}
`;
}

/** "1 h 20 min" a partir de 80. Derivado, nunca guardado. */
function formatarDuracao(minutes) {
	const horas = Math.floor(minutes / 60);
	const resto = minutes % 60;
	if (horas === 0) return `${resto} min`;
	if (resto === 0) return `${horas} h`;
	return `${horas} h ${resto} min`;
}

async function main() {
	const dryRun = process.argv.includes("--dry-run");
	const url = process.env.DATABASE_URL;
	if (!url) {
		console.error("Defina DATABASE_URL.");
		process.exit(1);
	}

	const db = drizzle(url);

	const familias = await db
		.select()
		.from(productFamily)
		.orderBy(asc(productFamily.position));
	const linhasProduto = await db
		.select()
		.from(product)
		.orderBy(asc(product.position));
	const linhasReceita = await db
		.select()
		.from(recipe)
		.orderBy(asc(recipe.slug));
	const vinculos = await db
		.select()
		.from(recipeProduct)
		.orderBy(asc(recipeProduct.position));

	const nomePorFamilia = new Map(familias.map((f) => [f.slug, f.name]));

	const produtos = linhasProduto.map((linha) => ({
		slug: linha.slug,
		name: linha.name,
		familySlug: linha.familySlug,
		family: nomePorFamilia.get(linha.familySlug) ?? "",
		image: linha.image ?? "",
	}));

	const receitas = linhasReceita.map((linha) => ({
		slug: linha.slug,
		name: linha.name,
		time: formatarDuracao(linha.minutes),
		minutes: linha.minutes,
		level: linha.level,
		servings: linha.servings,
		category: linha.category,
		summary: linha.summary,
		image: linha.image ?? "",
		ingredients: linha.ingredients,
		steps: linha.steps,
		usedProductSlugs: vinculos
			.filter((v) => v.recipeSlug === linha.slug)
			.map((v) => v.productSlug),
	}));

	console.log(
		`banco: ${familias.length} famílias, ${produtos.length} produtos, ${receitas.length} receitas`,
	);

	if (dryRun) {
		console.log("(dry-run — nada gravado)");
		process.exit(0);
	}

	await writeFile(
		path.join(DATA, "products.ts"),
		moduloProdutos(familias, produtos),
		"utf8",
	);
	await writeFile(
		path.join(DATA, "recipes.ts"),
		moduloReceitas(receitas),
		"utf8",
	);

	console.log("apps/web/src/data/{products,recipes}.ts regravados");
	console.log("rode `pnpm --filter web build` para publicar o site");
	process.exit(0);
}

await main();
