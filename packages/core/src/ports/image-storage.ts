import type { ImageKey } from "../domain/image";

/**
 * Portas das imagens.
 *
 * Duas, e separadas de propósito: guardar bytes e tratar bytes são
 * responsabilidades de infraestrutura diferentes — um bucket e uma biblioteca
 * nativa —, e nos testes cada uma é substituída sozinha.
 */

export interface ImagemGuardada {
	key: ImageKey;
	contentType: string;
	tamanho: number;
}

export interface ImageStorage {
	guardar(
		key: ImageKey,
		corpo: Uint8Array,
		contentType: string,
	): Promise<ImagemGuardada>;

	/** Metadados, sem baixar o arquivo. `null` quando não existe. */
	descrever(key: ImageKey): Promise<ImagemGuardada | null>;

	baixar(key: ImageKey): Promise<Uint8Array | null>;

	listar(prefixo: string): Promise<ImageKey[]>;

	remover(key: ImageKey): Promise<void>;

	/**
	 * Endereço público da chave.
	 *
	 * Mora na porta, não no domínio: o host muda por provedor e por ambiente, e
	 * é a única parte disso que é endereço de infraestrutura.
	 */
	urlPublica(key: ImageKey): string;
}

export interface ImageProcessor {
	/** Recorta, redimensiona e converte para WebP conforme `PACKSHOT`. */
	paraPackshot(original: Uint8Array): Promise<Uint8Array>;
}

export interface ImageServices {
	storage: ImageStorage;
	processor: ImageProcessor;
}
