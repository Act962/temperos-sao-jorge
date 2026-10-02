import { InvalidInputError, NotFoundError } from "../domain/errors";
import {
	chaveDePackshot,
	chaveDeReceita,
	ehChaveDeImagem,
	familiaDaChave,
	type ImageKey,
	validarEnvio,
} from "../domain/image";
import { comoSlug } from "../domain/slug";
import type {
	ImagemGuardada,
	ImageServices,
	ImageStorage,
} from "../ports/image-storage";

/**
 * Casos de uso das imagens.
 *
 * Recebem as portas por parâmetro, como todo o resto: é o que faz o mesmo
 * código rodar contra o R2 em produção e contra memória no teste, sem rede e
 * sem credencial.
 */

export interface EnvioDePackshot {
	familySlug: string;
	slug: string;
	contentType: string;
	corpo: Uint8Array;
	/** Distingue este envio do anterior. Veja `chaveDePackshot`. */
	versao?: string;
}

/**
 * Versão para um envio feito agora.
 *
 * O instante garante a ordem e o trecho aleatório separa dois envios do mesmo
 * milissegundo. Não precisa ser imprevisível: o endereço da foto é público.
 */
export function novaVersaoDeImagem(agora: number = Date.now()): string {
	const acaso = Math.random().toString(36).slice(2, 6).padEnd(4, "0");
	return `${agora.toString(36)}${acaso}`;
}

export async function guardarPackshot(
	servicos: ImageServices,
	envio: EnvioDePackshot,
): Promise<ImagemGuardada> {
	validarEnvio({ contentType: envio.contentType, tamanho: envio.corpo.length });

	const key = chaveDePackshot(envio.familySlug, envio.slug, envio.versao);
	const tratado = await servicos.processor.paraPackshot(envio.corpo);

	// Sempre WebP na saída, qualquer que tenha sido a entrada: é o que a chave
	// promete, e é o que o site consome.
	return servicos.storage.guardar(key, tratado, "image/webp");
}

export async function guardarFotoDeReceita(
	servicos: ImageServices,
	envio: {
		slug: string;
		contentType: string;
		corpo: Uint8Array;
		versao?: string;
	},
): Promise<ImagemGuardada> {
	validarEnvio({ contentType: envio.contentType, tamanho: envio.corpo.length });

	const key = chaveDeReceita(envio.slug, envio.versao);
	// Tratamento próprio: foto de prato não tem moldura transparente para
	// recortar e aparece maior que um packshot (spec 0010).
	const tratado = await servicos.processor.paraFotoDeReceita(envio.corpo);
	return servicos.storage.guardar(key, tratado, "image/webp");
}

/**
 * Apaga do bucket a foto que deixou de ser usada.
 *
 * Recebe o que estava em `image` antes e o que ficou depois de uma gravação.
 * Só age quando o valor anterior é chave do bucket e mudou: caminho antigo
 * mora em `public/`, não no bucket, e foto que continua em uso não se apaga.
 *
 * Devolve a chave apagada, ou `null` quando não havia o que apagar.
 */
export async function descartarFotoSubstituida(
	storage: ImageStorage,
	anterior: string | null,
	atual: string | null,
): Promise<ImageKey | null> {
	if (anterior === null || anterior === atual) return null;
	if (!ehChaveDeImagem(anterior)) return null;

	await storage.remover(anterior);
	return anterior;
}

/**
 * Confere que a chave existe e está na pasta da família informada.
 *
 * Mesma regra que hoje protege o caminho no disco: um produto que mudou de
 * família com a foto parada aponta para a pasta errada, e o site mostraria o
 * packshot de outra prateleira.
 */
export async function exigirPackshotDaFamilia(
	storage: ImageStorage,
	key: ImageKey,
	familySlug: string,
): Promise<ImagemGuardada> {
	const familia = familiaDaChave(key);
	const esperada = comoSlug(familySlug);

	if (familia === null) {
		throw new InvalidInputError(
			`"${key}" não é a chave de um packshot: esperado products/<familia>/<slug>.webp.`,
		);
	}

	if (familia !== esperada) {
		throw new InvalidInputError(
			`O packshot está na pasta de outra família: "${key}" não pertence a "${esperada}".`,
		);
	}

	const guardada = await storage.descrever(key);
	if (!guardada) throw new NotFoundError("Imagem", key);
	return guardada;
}

export async function listarPackshotsDaFamilia(
	storage: ImageStorage,
	familySlug: string,
): Promise<ImageKey[]> {
	return storage.listar(`products/${comoSlug(familySlug)}/`);
}

export async function removerImagem(
	storage: ImageStorage,
	key: ImageKey,
): Promise<void> {
	if (!(await storage.descrever(key))) {
		throw new NotFoundError("Imagem", key);
	}
	await storage.remover(key);
}
