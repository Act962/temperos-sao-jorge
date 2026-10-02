import { InvalidInputError } from "./errors";
import { ehCaminhoAntigo, ehChaveDeImagem } from "./image";
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
	/**
	 * O packshot: caminho antigo em `public/`, chave do bucket, ou null enquanto
	 * a foto não existir. Quem transforma em endereço é `urlDaImagem`.
	 */
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
 * Confere o packshot de um produto.
 *
 * O caminho antigo é verificado contra o formato que
 * `scripts/optimize-product-images.mjs` grava, e contra a pasta da família:
 * foi digitado à mão, e divergir não quebra nada de imediato — o site só
 * mostra um placeholder, o que passa despercebido até alguém abrir a página.
 *
 * A chave do bucket não passa pela conferência da família (spec 0010): a foto
 * foi enviada para este produto, e exigir a pasta obrigaria a reenviá-la toda
 * vez que o produto muda de família.
 */
function conferirPackshot(image: string, name: string, familySlug: string) {
	if (!ehCaminhoAntigo(image)) {
		if (!ehChaveDeImagem(image) || !image.startsWith("products/")) {
			throw new InvalidInputError(
				`Foto de "${name}" fora do padrão: "${image}". Esperado /images/products/<familia>/<slug>.webp ou a chave de uma foto enviada pelo painel.`,
			);
		}
		return;
	}

	if (!CAMINHO_PACKSHOT.test(image)) {
		throw new InvalidInputError(
			`Caminho de packshot fora do padrão: "${image}". Esperado /images/products/<familia>/<slug>.webp`,
		);
	}

	if (!image.startsWith(`/images/products/${familySlug}/`)) {
		throw new InvalidInputError(
			`O packshot de "${name}" está na pasta de outra família: ${image}`,
		);
	}
}

/** Constrói um produto válido. */
export function criarProduto(entrada: NovoProduto): Product {
	const name = entrada.name.trim();
	if (name === "") {
		throw new InvalidInputError("O produto precisa de um nome.");
	}

	const image = entrada.image ?? null;
	const familySlug = comoSlug(entrada.familySlug);
	if (image !== null) conferirPackshot(image, name, familySlug);

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
