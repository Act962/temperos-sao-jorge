#!/usr/bin/env node
/**
 * Atualiza a reserva do catálogo: lê o Postgres e regrava os módulos de dados
 * do site.
 *
 * Desde a spec 0007 o site lê o banco a cada visita, e estes arquivos são o
 * que ele serve quando não há `DATABASE_URL` ou o banco não responde. A edição
 * não depende mais deste comando para ir ao ar; ele só impede a reserva de
 * ficar muito atrás do banco. Vale rodar antes de um deploy.
 *
 * Uso:
 *   pnpm run catalog:publish [-- --dry-run]
 */

import { execFile } from "node:child_process";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import {
	product,
	productFamily,
	recipe,
	recipeProduct,
} from "../src/schema/catalog.ts";
import { siteContent } from "../src/schema/content.ts";

const ROOT = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../../..",
);
const DATA = path.join(ROOT, "apps/web/src/data");

const AVISO = `// Gerado por packages/db/scripts/publish-catalog.mjs — não edite à mão.
// A fonte da verdade é o Postgres; rode \`pnpm run catalog:publish\` para
// regravar este arquivo a partir do banco.
//
// É a reserva que o site serve sem banco. As rotas e os componentes leem o
// catálogo por \`@/lib/catalog\` e daqui só importam tipo.
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

`;
}

/**
 * Os documentos de conteúdo, como estão no banco.
 *
 * Vão crus: quem confere a forma é `resolverConteudo`, na hora em que o site
 * monta a reserva — a mesma função que confere o que vem do banco.
 */
function moduloConteudo(documentos) {
	return `// Gerado por packages/db/scripts/publish-catalog.mjs — não edite à mão.
// A fonte da verdade é o Postgres; rode \`pnpm run catalog:publish\` para
// regravar este arquivo a partir do banco.
//
// É a reserva que o site serve sem banco: os documentos de conteúdo salvos
// pelo painel. Chave ausente vale o padrão de \`@my-better-t-app/core\`.

export const PUBLISHED_CONTENT: Record<string, unknown> = ${json(documentos)};
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

	// Mesma ordem de `montarCatalogoPublicado`: por slug, caractere a caractere.
	// O `ORDER BY` acima segue o idioma do banco, que varia de máquina para
	// máquina, e a reserva tem que sair igual ao que o site lê ao vivo.
	linhasReceita.sort((a, b) =>
		a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0,
	);

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

	const linhasConteudo = await db
		.select()
		.from(siteContent)
		.orderBy(asc(siteContent.key));
	const documentos = Object.fromEntries(
		linhasConteudo.map((linha) => [linha.key, linha.data]),
	);

	console.log(
		`banco: ${familias.length} famílias, ${produtos.length} produtos, ${receitas.length} receitas, ${linhasConteudo.length} documentos de conteúdo`,
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

	await writeFile(
		path.join(DATA, "content.ts"),
		moduloConteudo(documentos),
		"utf8",
	);

	// O gerador emite JSON puro (chaves entre aspas, sem vírgula final). Sem
	// passar o Biome aqui, publicar duas vezes seguidas produziria um diff
	// enorme de puro estilo e esconderia a mudança de conteúdo de verdade.
	await formatar([
		path.join(DATA, "products.ts"),
		path.join(DATA, "recipes.ts"),
		path.join(DATA, "content.ts"),
	]);

	console.log("apps/web/src/data/{products,recipes,content}.ts regravados");
	console.log("a reserva entra no ar no próximo build do site");
	process.exit(0);
}

async function formatar(arquivos) {
	const biome = path.join(ROOT, "node_modules", ".bin", "biome");
	try {
		await promisify(execFile)(biome, ["check", "--write", ...arquivos], {
			shell: process.platform === "win32",
		});
	} catch (erro) {
		console.warn("aviso: nao foi possivel formatar a saida com o Biome");
		console.warn(erro.message);
	}
}

await main();
