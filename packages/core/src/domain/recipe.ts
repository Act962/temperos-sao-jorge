import { InvalidInputError } from "./errors";
import { comoSlug, type Slug } from "./slug";

export const NIVEIS = ["Fácil", "Média", "Difícil"] as const;
export type RecipeLevel = (typeof NIVEIS)[number];

export const CATEGORIAS = ["Almoço", "Jantar", "Lanches", "Festas"] as const;
export type RecipeCategory = (typeof CATEGORIAS)[number];

export interface Recipe {
	readonly slug: Slug;
	readonly name: string;
	readonly summary: string;
	readonly minutes: number;
	readonly level: RecipeLevel;
	readonly servings: number;
	readonly category: RecipeCategory;
	readonly image: string | null;
	readonly ingredients: readonly string[];
	readonly steps: readonly string[];
	/** Produtos do catálogo usados na receita. */
	readonly usedProductSlugs: readonly Slug[];
}

export interface NovaReceita {
	slug: string;
	name: string;
	summary: string;
	minutes: number;
	level: RecipeLevel;
	servings: number;
	category: RecipeCategory;
	image?: string | null;
	ingredients: readonly string[];
	steps: readonly string[];
	usedProductSlugs?: readonly string[];
}

/**
 * Formata a duração para leitura: 80 vira "1 h 20 min", 30 vira "30 min".
 *
 * Deriva de `minutes` de propósito. Antes eram dois campos independentes, e
 * bastava um ficar desatualizado para a receita aparecer com um tempo e cair
 * no balde de filtro do outro.
 */
export function formatarDuracao(minutes: number): string {
	const horas = Math.floor(minutes / 60);
	const resto = minutes % 60;

	if (horas === 0) return `${resto} min`;
	if (resto === 0) return `${horas} h`;
	return `${horas} h ${resto} min`;
}

/** Duração em ISO 8601, como o schema.org de Recipe pede. */
export function duracaoIso(minutes: number): string {
	const horas = Math.floor(minutes / 60);
	const resto = minutes % 60;
	return `PT${horas > 0 ? `${horas}H` : ""}${resto > 0 ? `${resto}M` : ""}`;
}

export function criarReceita(entrada: NovaReceita): Recipe {
	const name = entrada.name.trim();
	if (name === "") {
		throw new InvalidInputError("A receita precisa de um nome.");
	}

	if (!Number.isInteger(entrada.minutes) || entrada.minutes <= 0) {
		throw new InvalidInputError(
			`Duração inválida para "${name}": ${entrada.minutes}. Informe minutos inteiros e positivos.`,
		);
	}

	if (!Number.isInteger(entrada.servings) || entrada.servings <= 0) {
		throw new InvalidInputError(
			`Número de porções inválido para "${name}": ${entrada.servings}.`,
		);
	}

	if (entrada.ingredients.length === 0) {
		throw new InvalidInputError(
			`"${name}" precisa de ao menos um ingrediente.`,
		);
	}

	if (entrada.steps.length === 0) {
		throw new InvalidInputError(
			`"${name}" precisa de ao menos um passo de preparo.`,
		);
	}

	return {
		slug: comoSlug(entrada.slug),
		name,
		summary: entrada.summary.trim(),
		minutes: entrada.minutes,
		level: entrada.level,
		servings: entrada.servings,
		category: entrada.category,
		image: entrada.image ?? null,
		ingredients: [...entrada.ingredients],
		steps: [...entrada.steps],
		usedProductSlugs: (entrada.usedProductSlugs ?? []).map(comoSlug),
	};
}
