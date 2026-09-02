import type {
	Product,
	ProductFamily,
	ProductRepository,
	Recipe,
	RecipeCategory,
	RecipeLevel,
	RecipeRepository,
	Slug,
} from "@my-better-t-app/core";
import { comoSlug } from "@my-better-t-app/core";
import { asc, eq } from "drizzle-orm";
import type { Database } from "../index";
import {
	product,
	productFamily,
	recipe,
	recipeProduct,
} from "../schema/catalog";

/**
 * Adaptadores Drizzle das portas definidas em `@my-better-t-app/core`.
 *
 * Só isto sabe que existe Postgres. O domínio e os casos de uso continuam
 * ignorando o banco, e é por isso que rodam contra memória nos testes.
 */

type LinhaProduto = typeof product.$inferSelect;
type LinhaFamilia = typeof productFamily.$inferSelect;
type LinhaReceita = typeof recipe.$inferSelect;

function paraProduto(linha: LinhaProduto): Product {
	return {
		slug: comoSlug(linha.slug),
		name: linha.name,
		familySlug: comoSlug(linha.familySlug),
		image: linha.image,
		position: linha.position,
	};
}

function paraFamilia(linha: LinhaFamilia): ProductFamily {
	return {
		slug: comoSlug(linha.slug),
		name: linha.name,
		position: linha.position,
	};
}

function paraReceita(linha: LinhaReceita, produtos: string[]): Recipe {
	return {
		slug: comoSlug(linha.slug),
		name: linha.name,
		summary: linha.summary,
		minutes: linha.minutes,
		level: linha.level as RecipeLevel,
		servings: linha.servings,
		category: linha.category as RecipeCategory,
		image: linha.image,
		ingredients: linha.ingredients,
		steps: linha.steps,
		usedProductSlugs: produtos.map(comoSlug),
	};
}

export class DrizzleProductRepository implements ProductRepository {
	constructor(private readonly db: Database) {}

	async listFamilies(): Promise<ProductFamily[]> {
		const linhas = await this.db
			.select()
			.from(productFamily)
			.orderBy(asc(productFamily.position));
		return linhas.map(paraFamilia);
	}

	async findFamily(slug: Slug): Promise<ProductFamily | null> {
		const [linha] = await this.db
			.select()
			.from(productFamily)
			.where(eq(productFamily.slug, slug))
			.limit(1);
		return linha ? paraFamilia(linha) : null;
	}

	async saveFamily(family: ProductFamily): Promise<void> {
		await this.db
			.insert(productFamily)
			.values(family)
			.onConflictDoUpdate({
				target: productFamily.slug,
				set: {
					name: family.name,
					position: family.position,
					updatedAt: new Date(),
				},
			});
	}

	async list(): Promise<Product[]> {
		const linhas = await this.db
			.select()
			.from(product)
			.orderBy(asc(product.position));
		return linhas.map(paraProduto);
	}

	async listByFamily(familySlug: Slug): Promise<Product[]> {
		const linhas = await this.db
			.select()
			.from(product)
			.where(eq(product.familySlug, familySlug))
			.orderBy(asc(product.position));
		return linhas.map(paraProduto);
	}

	async find(slug: Slug): Promise<Product | null> {
		const [linha] = await this.db
			.select()
			.from(product)
			.where(eq(product.slug, slug))
			.limit(1);
		return linha ? paraProduto(linha) : null;
	}

	async save(item: Product): Promise<void> {
		await this.db
			.insert(product)
			.values(item)
			.onConflictDoUpdate({
				target: product.slug,
				set: {
					name: item.name,
					familySlug: item.familySlug,
					image: item.image,
					position: item.position,
					updatedAt: new Date(),
				},
			});
	}

	async delete(slug: Slug): Promise<void> {
		await this.db.delete(product).where(eq(product.slug, slug));
	}
}

export class DrizzleRecipeRepository implements RecipeRepository {
	constructor(private readonly db: Database) {}

	private async produtosDe(recipeSlug: string): Promise<string[]> {
		const linhas = await this.db
			.select({ slug: recipeProduct.productSlug })
			.from(recipeProduct)
			.where(eq(recipeProduct.recipeSlug, recipeSlug))
			.orderBy(asc(recipeProduct.position));
		return linhas.map((linha) => linha.slug);
	}

	async list(): Promise<Recipe[]> {
		const linhas = await this.db
			.select()
			.from(recipe)
			.orderBy(asc(recipe.slug));
		return Promise.all(
			linhas.map(async (linha) =>
				paraReceita(linha, await this.produtosDe(linha.slug)),
			),
		);
	}

	async find(slug: Slug): Promise<Recipe | null> {
		const [linha] = await this.db
			.select()
			.from(recipe)
			.where(eq(recipe.slug, slug))
			.limit(1);
		if (!linha) return null;
		return paraReceita(linha, await this.produtosDe(linha.slug));
	}

	async save(item: Recipe): Promise<void> {
		// Receita e produtos citados mudam juntos: numa falha entre os dois, a
		// receita ficaria apontando para a lista antiga.
		await this.db.transaction(async (tx) => {
			await tx
				.insert(recipe)
				.values({
					slug: item.slug,
					name: item.name,
					summary: item.summary,
					minutes: item.minutes,
					level: item.level,
					servings: item.servings,
					category: item.category,
					image: item.image,
					ingredients: [...item.ingredients],
					steps: [...item.steps],
				})
				.onConflictDoUpdate({
					target: recipe.slug,
					set: {
						name: item.name,
						summary: item.summary,
						minutes: item.minutes,
						level: item.level,
						servings: item.servings,
						category: item.category,
						image: item.image,
						ingredients: [...item.ingredients],
						steps: [...item.steps],
						updatedAt: new Date(),
					},
				});

			await tx
				.delete(recipeProduct)
				.where(eq(recipeProduct.recipeSlug, item.slug));

			if (item.usedProductSlugs.length > 0) {
				await tx.insert(recipeProduct).values(
					item.usedProductSlugs.map((productSlug, position) => ({
						recipeSlug: item.slug,
						productSlug,
						position,
					})),
				);
			}
		});
	}

	async delete(slug: Slug): Promise<void> {
		await this.db.delete(recipe).where(eq(recipe.slug, slug));
	}
}

export function repositoriosDrizzle(db: Database) {
	return {
		products: new DrizzleProductRepository(db),
		recipes: new DrizzleRecipeRepository(db),
	};
}
