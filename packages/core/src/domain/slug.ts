import { InvalidInputError } from "./errors";

const FORMATO = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Identificador legível usado nas URLs.
 *
 * É o tipo mais reaproveitado do domínio, e a regra vive aqui porque já custou
 * caro: os slugs vêm de nomes de arquivo com acento, maiúscula e espaço, e um
 * slug inválido só aparecia como 404 em produção.
 */
export type Slug = string & { readonly __marca: "Slug" };

export function ehSlug(valor: string): valor is Slug {
	return FORMATO.test(valor);
}

/** Valida sem transformar. Use quando o valor já deveria estar normalizado. */
export function comoSlug(valor: string): Slug {
	if (!ehSlug(valor)) {
		throw new InvalidInputError(
			`Slug inválido: "${valor}". Use apenas minúsculas, números e hífen simples.`,
		);
	}
	return valor;
}

/** Deriva um slug a partir de texto livre — acentos e pontuação incluídos. */
export function paraSlug(texto: string): Slug {
	const normalizado = texto
		.toLowerCase()
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

	if (normalizado === "") {
		throw new InvalidInputError(
			`Não foi possível derivar um slug de "${texto}".`,
		);
	}
	return normalizado as Slug;
}
