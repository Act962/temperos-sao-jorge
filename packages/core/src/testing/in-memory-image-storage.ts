import type { ImageKey } from "../domain/image";
import type {
	ImagemGuardada,
	ImageProcessor,
	ImageServices,
	ImageStorage,
} from "../ports/image-storage";

/** Bucket de mentira: um Map, com a mesma semântica do de verdade. */
export class InMemoryImageStorage implements ImageStorage {
	private readonly arquivos = new Map<
		ImageKey,
		{ corpo: Uint8Array; contentType: string }
	>();

	constructor(private readonly base = "https://imagens.exemplo") {}

	async guardar(
		key: ImageKey,
		corpo: Uint8Array,
		contentType: string,
	): Promise<ImagemGuardada> {
		// Cópia: quem chamou pode reaproveitar o buffer, e um bucket de verdade
		// não veria as alterações posteriores.
		this.arquivos.set(key, { corpo: Uint8Array.from(corpo), contentType });
		return { key, contentType, tamanho: corpo.length };
	}

	async descrever(key: ImageKey): Promise<ImagemGuardada | null> {
		const arquivo = this.arquivos.get(key);
		if (!arquivo) return null;
		return {
			key,
			contentType: arquivo.contentType,
			tamanho: arquivo.corpo.length,
		};
	}

	async baixar(key: ImageKey): Promise<Uint8Array | null> {
		const arquivo = this.arquivos.get(key);
		return arquivo ? Uint8Array.from(arquivo.corpo) : null;
	}

	async listar(prefixo: string): Promise<ImageKey[]> {
		return [...this.arquivos.keys()].filter((key) => key.startsWith(prefixo));
	}

	async remover(key: ImageKey): Promise<void> {
		this.arquivos.delete(key);
	}

	urlPublica(key: ImageKey): string {
		return `${this.base}/${key}`;
	}
}

/**
 * Processador que só marca por onde passou.
 *
 * O tratamento de verdade é `sharp`, que é binário nativo e não entra em
 * `packages/core`. O que os casos de uso precisam provar é que passaram o
 * original pelo processador antes de guardar — não o que o `sharp` faz com os
 * pixels, que é assunto do teste do adaptador.
 */
export class FakeImageProcessor implements ImageProcessor {
	public chamadas = 0;

	async paraPackshot(original: Uint8Array): Promise<Uint8Array> {
		this.chamadas += 1;
		return Uint8Array.from([0x77, 0x45, 0x42, 0x50, ...original]);
	}
}

export function servicosDeImagemEmMemoria(): ImageServices & {
	storage: InMemoryImageStorage;
	processor: FakeImageProcessor;
} {
	return {
		storage: new InMemoryImageStorage(),
		processor: new FakeImageProcessor(),
	};
}
