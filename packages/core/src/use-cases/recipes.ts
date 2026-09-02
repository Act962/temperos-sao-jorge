import {
	ConflictError,
	InvalidInputError,
	NotFoundError,
} from "../domain/errors";
import { criarReceita, type NovaReceita, type Recipe } from "../domain/recipe";
import { comoSlug } from "../domain/slug";
import type {
	ProductRepository,
	RecipeRepository,
} from "../ports/catalog-repository";

export async function listarReceitas(
	repo: RecipeRepository,
): Promise<Recipe[]> {
	return repo.list();
}

export async function obterReceita(
	repo: RecipeRepository,
	slug: string,
): Promise<Recipe> {
	const receita = await repo.find(comoSlug(slug));
	if (!receita) throw new NotFoundError("Receita", slug);
	return receita;
}

/**
 * Confere que todo produto citado existe no catálogo.
 *
 * A página da receita monta "Produtos utilizados" a partir dessa lista, e um
 * slug errado desaparece da tela sem erro nenhum — o tipo de falha que só
 * aparece quando alguém repara que a seção ficou menor.
 */
async function exigirProdutosExistentes(
	produtos: ProductRepository,
	slugs: readonly string[],
): Promise<void> {
	const ausentes: string[] = [];

	for (const slug of slugs) {
		if (!(await produtos.find(comoSlug(slug)))) ausentes.push(slug);
	}

	if (ausentes.length > 0) {
		throw new InvalidInputError(
			`Produtos citados que não existem no catálogo: ${ausentes.join(", ")}.`,
		);
	}
}

export async function criarNovaReceita(
	repos: { recipes: RecipeRepository; products: ProductRepository },
	entrada: NovaReceita,
): Promise<Recipe> {
	const receita = criarReceita(entrada);

	if (await repos.recipes.find(receita.slug)) {
		throw new ConflictError(
			`Já existe uma receita com o slug "${receita.slug}".`,
		);
	}

	await exigirProdutosExistentes(repos.products, receita.usedProductSlugs);
	await repos.recipes.save(receita);
	return receita;
}

export async function atualizarReceita(
	repos: { recipes: RecipeRepository; products: ProductRepository },
	slug: string,
	alteracoes: Partial<Omit<NovaReceita, "slug">>,
): Promise<Recipe> {
	const atual = await obterReceita(repos.recipes, slug);

	const atualizada = criarReceita({
		slug: atual.slug,
		name: alteracoes.name ?? atual.name,
		summary: alteracoes.summary ?? atual.summary,
		minutes: alteracoes.minutes ?? atual.minutes,
		level: alteracoes.level ?? atual.level,
		servings: alteracoes.servings ?? atual.servings,
		category: alteracoes.category ?? atual.category,
		image: alteracoes.image === undefined ? atual.image : alteracoes.image,
		ingredients: alteracoes.ingredients ?? atual.ingredients,
		steps: alteracoes.steps ?? atual.steps,
		usedProductSlugs: alteracoes.usedProductSlugs ?? atual.usedProductSlugs,
	});

	await exigirProdutosExistentes(repos.products, atualizada.usedProductSlugs);
	await repos.recipes.save(atualizada);
	return atualizada;
}

export async function removerReceita(
	repo: RecipeRepository,
	slug: string,
): Promise<void> {
	await obterReceita(repo, slug);
	await repo.delete(comoSlug(slug));
}
