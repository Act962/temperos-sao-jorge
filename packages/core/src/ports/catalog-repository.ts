import type { Product, ProductFamily } from "../domain/product";
import type { Recipe } from "../domain/recipe";
import type { Slug } from "../domain/slug";

/**
 * Portas de persistência.
 *
 * O domínio declara o que precisa; quem implementa fica fora — Drizzle em
 * produção, memória nos testes. É o que permite exercitar todo caso de uso sem
 * Postgres no ar.
 */

export interface ProductRepository {
	listFamilies(): Promise<ProductFamily[]>;
	findFamily(slug: Slug): Promise<ProductFamily | null>;
	saveFamily(family: ProductFamily): Promise<void>;

	list(): Promise<Product[]>;
	listByFamily(familySlug: Slug): Promise<Product[]>;
	find(slug: Slug): Promise<Product | null>;
	save(product: Product): Promise<void>;
	delete(slug: Slug): Promise<void>;
}

export interface RecipeRepository {
	list(): Promise<Recipe[]>;
	/** Receitas que citam o produto — quem impede apagá-lo. */
	listByProduct(productSlug: Slug): Promise<Recipe[]>;
	find(slug: Slug): Promise<Recipe | null>;
	save(recipe: Recipe): Promise<void>;
	delete(slug: Slug): Promise<void>;
}

export interface CatalogRepositories {
	products: ProductRepository;
	recipes: RecipeRepository;
}
