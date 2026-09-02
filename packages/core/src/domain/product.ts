import { InvalidInputError } from "./errors";
import { comoSlug, type Slug } from "./slug";

export interface ProductFamily {
	readonly slug: Slug;
	readonly name: string;
	/** Ordem de exibição no site; menor aparece antes. */
	readonly position: number;
}

export interface Product {
	readonly slug: Slug;
	readonly name: string;
	readonly familySlug: Slug;
	/** Caminho público do packshot, ou null enquanto a foto não existir. */
	readonly image: string | null;
	readonly position: number;
}

export interface NovoProduto {
	slug: string;
	name: string;
	familySlug: string;
	image?: string | null;
	position?: number;
}

const CAMINHO_PACKSHOT = /^\/images\/products\/[a-z0-9-]+\/[a-z0-9-]+\.webp$/;

/**
 * Constrói um produto válido.
 *
 * O caminho do packshot é verificado contra o formato que
 * `scripts/optimize-product-images.mjs` grava. Divergir não quebra nada de
 * imediato: o site simplesmente mostra um placeholder no lugar do produto, o
 * que passa despercebido até alguém abrir a página.
 */
export function criarProduto(entrada: NovoProduto): Product {
	const name = entrada.name.trim();
	if (name === "") {
		throw new InvalidInputError("O produto precisa de um nome.");
	}

	const image = entrada.image ?? null;
	if (image !== null && !CAMINHO_PACKSHOT.test(image)) {
		throw new InvalidInputError(
			`Caminho de packshot fora do padrão: "${image}". Esperado /images/products/<familia>/<slug>.webp`,
		);
	}

	const familySlug = comoSlug(entrada.familySlug);

	if (image !== null && !image.startsWith(`/images/products/${familySlug}/`)) {
		throw new InvalidInputError(
			`O packshot de "${name}" está na pasta de outra família: ${image}`,
		);
	}

	return {
		slug: comoSlug(entrada.slug),
		name,
		familySlug,
		image,
		position: entrada.position ?? 0,
	};
}

export function criarFamilia(entrada: {
	slug: string;
	name: string;
	position?: number;
}): ProductFamily {
	const name = entrada.name.trim();
	if (name === "") {
		throw new InvalidInputError("A família precisa de um nome.");
	}

	return {
		slug: comoSlug(entrada.slug),
		name,
		position: entrada.position ?? 0,
	};
}
