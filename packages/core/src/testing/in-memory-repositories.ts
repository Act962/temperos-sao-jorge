import type { Product, ProductFamily } from "../domain/product";
import type { Recipe } from "../domain/recipe";
import type { Slug } from "../domain/slug";
import type {
	CatalogRepositories,
	ProductRepository,
	RecipeRepository,
} from "../ports/catalog-repository";

/**
 * Adaptadores em memória.
 *
 * Implementam as mesmas portas que o Drizzle implementa, então todo caso de uso
 * roda idêntico aqui — sem Postgres, sem docker e em milissegundos. É o retorno
 * concreto de manter o domínio sem dependência de infraestrutura.
 *
 * Ficam em `src/testing` para o adaptador real não poder importá-los por
 * engano.
 */

export class InMemoryProductRepository implements ProductRepository {
	private readonly families = new Map<Slug, ProductFamily>();
	private readonly products = new Map<Slug, Product>();

	constructor(dados?: {
		families?: readonly ProductFamily[];
		products?: readonly Product[];
	}) {
		for (const family of dados?.families ?? [])
			this.families.set(family.slug, family);
		for (const product of dados?.products ?? [])
			this.products.set(product.slug, product);
	}

	async listFamilies(): Promise<ProductFamily[]> {
		return [...this.families.values()];
	}

	async findFamily(slug: Slug): Promise<ProductFamily | null> {
		return this.families.get(slug) ?? null;
	}

	async saveFamily(family: ProductFamily): Promise<void> {
		this.families.set(family.slug, family);
	}

	async list(): Promise<Product[]> {
		return [...this.products.values()];
	}

	async listByFamily(familySlug: Slug): Promise<Product[]> {
		return [...this.products.values()].filter(
			(product) => product.familySlug === familySlug,
		);
	}

	async find(slug: Slug): Promise<Product | null> {
		return this.products.get(slug) ?? null;
	}

	async save(product: Product): Promise<void> {
		this.products.set(product.slug, product);
	}

	async delete(slug: Slug): Promise<void> {
		this.products.delete(slug);
	}
}

export class InMemoryRecipeRepository implements RecipeRepository {
	private readonly recipes = new Map<Slug, Recipe>();

	constructor(dados?: readonly Recipe[]) {
		for (const recipe of dados ?? []) this.recipes.set(recipe.slug, recipe);
	}

	async list(): Promise<Recipe[]> {
		return [...this.recipes.values()];
	}

	async listByProduct(productSlug: Slug): Promise<Recipe[]> {
		return [...this.recipes.values()].filter((receita) =>
			receita.usedProductSlugs.includes(productSlug),
		);
	}

	async find(slug: Slug): Promise<Recipe | null> {
		return this.recipes.get(slug) ?? null;
	}

	async save(recipe: Recipe): Promise<void> {
		this.recipes.set(recipe.slug, recipe);
	}

	async delete(slug: Slug): Promise<void> {
		this.recipes.delete(slug);
	}
}

export function repositoriosEmMemoria(dados?: {
	families?: readonly ProductFamily[];
	products?: readonly Product[];
	recipes?: readonly Recipe[];
}): CatalogRepositories {
	return {
		products: new InMemoryProductRepository(dados),
		recipes: new InMemoryRecipeRepository(dados?.recipes),
	};
}
