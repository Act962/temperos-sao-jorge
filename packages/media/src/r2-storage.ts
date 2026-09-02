import {
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	ListObjectsV2Command,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import type {
	ImageKey,
	ImagemGuardada,
	ImageStorage,
} from "@my-better-t-app/core";
import { comoChaveDeImagem } from "@my-better-t-app/core";

export interface ConfiguracaoDeArmazenamento {
	endpoint: string;
	bucket: string;
	accessKeyId: string;
	secretAccessKey: string;
	/** Base pública das imagens, sem barra no fim. */
	urlPublica: string;
	/** R2 não usa região; "auto" é o valor que ele espera. */
	region?: string;
	forcePathStyle?: boolean;
}

/**
 * Armazenamento de imagens em bucket compatível com S3.
 *
 * O alvo é o Cloudflare R2, escolhido por não cobrar egresso — imagem é
 * justamente o arquivo cujo custo mora na saída. Mas a implementação fala S3
 * puro de propósito: é o que permite exercitar o adaptador contra um MinIO
 * local, sem conta na Cloudflare, e é o que deixa a porta trocável se um dia o
 * provedor mudar.
 */
export class R2ImageStorage implements ImageStorage {
	private readonly cliente: S3Client;
	private readonly bucket: string;
	private readonly base: string;

	constructor(config: ConfiguracaoDeArmazenamento) {
		this.bucket = config.bucket;
		this.base = config.urlPublica.replace(/\/+$/, "");
		this.cliente = new S3Client({
			endpoint: config.endpoint,
			region: config.region ?? "auto",
			credentials: {
				accessKeyId: config.accessKeyId,
				secretAccessKey: config.secretAccessKey,
			},
			// MinIO serve por caminho; o R2 aceita os dois.
			forcePathStyle: config.forcePathStyle ?? true,
		});
	}

	async guardar(
		key: ImageKey,
		corpo: Uint8Array,
		contentType: string,
	): Promise<ImagemGuardada> {
		await this.cliente.send(
			new PutObjectCommand({
				Bucket: this.bucket,
				Key: key,
				Body: corpo,
				ContentType: contentType,
				// Um ano, imutável: a chave carrega o slug, e trocar a foto de um
				// produto sem trocar o nome dele é o caso raro. Quando acontecer, o
				// jeito é invalidar no CDN, não encurtar o cache de todo mundo.
				CacheControl: "public, max-age=31536000, immutable",
			}),
		);

		return { key, contentType, tamanho: corpo.length };
	}

	async descrever(key: ImageKey): Promise<ImagemGuardada | null> {
		try {
			const resposta = await this.cliente.send(
				new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
			);
			return {
				key,
				contentType: resposta.ContentType ?? "application/octet-stream",
				tamanho: resposta.ContentLength ?? 0,
			};
		} catch (erro) {
			if (ehNaoEncontrado(erro)) return null;
			throw erro;
		}
	}

	async baixar(key: ImageKey): Promise<Uint8Array | null> {
		try {
			const resposta = await this.cliente.send(
				new GetObjectCommand({ Bucket: this.bucket, Key: key }),
			);
			if (!resposta.Body) return null;
			return new Uint8Array(await resposta.Body.transformToByteArray());
		} catch (erro) {
			if (ehNaoEncontrado(erro)) return null;
			throw erro;
		}
	}

	async listar(prefixo: string): Promise<ImageKey[]> {
		const chaves: ImageKey[] = [];
		let token: string | undefined;

		// Pagina até o fim: a resposta vem truncada em 1000, e uma família com
		// mais fotos que isso sumiria pela metade sem erro nenhum.
		do {
			const resposta = await this.cliente.send(
				new ListObjectsV2Command({
					Bucket: this.bucket,
					Prefix: prefixo,
					ContinuationToken: token,
				}),
			);

			for (const objeto of resposta.Contents ?? []) {
				// Chave fora do formato é lixo que alguém colocou no bucket por
				// fora; ignorar é melhor que derrubar a listagem inteira.
				if (objeto.Key && ehChaveValida(objeto.Key)) {
					chaves.push(objeto.Key as ImageKey);
				}
			}

			token = resposta.IsTruncated ? resposta.NextContinuationToken : undefined;
		} while (token);

		return chaves;
	}

	async remover(key: ImageKey): Promise<void> {
		await this.cliente.send(
			new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
		);
	}

	urlPublica(key: ImageKey): string {
		return `${this.base}/${key}`;
	}
}

function ehChaveValida(valor: string): boolean {
	try {
		comoChaveDeImagem(valor);
		return true;
	} catch {
		return false;
	}
}

/** O S3 sinaliza ausência por nome do erro ou por 404, dependendo do comando. */
function ehNaoEncontrado(erro: unknown): boolean {
	if (typeof erro !== "object" || erro === null) return false;
	const candidato = erro as {
		name?: string;
		$metadata?: { httpStatusCode?: number };
	};
	return (
		candidato.name === "NotFound" ||
		candidato.name === "NoSuchKey" ||
		candidato.$metadata?.httpStatusCode === 404
	);
}

/**
 * Monta a configuração a partir do ambiente.
 *
 * Fica aqui, e não em `packages/env`, porque as variáveis são opcionais
 * enquanto o site continua servindo `public/images/`: exigi-las no schema
 * compartilhado quebraria todo mundo que ainda não tem bucket.
 */
export function configuracaoDoAmbiente(
	ambiente: NodeJS.ProcessEnv = process.env,
): ConfiguracaoDeArmazenamento | null {
	const conta = ambiente.R2_ACCOUNT_ID;
	const bucket = ambiente.R2_BUCKET;
	const accessKeyId = ambiente.R2_ACCESS_KEY_ID;
	const secretAccessKey = ambiente.R2_SECRET_ACCESS_KEY;
	const urlPublica = ambiente.R2_PUBLIC_URL;

	if (!bucket || !accessKeyId || !secretAccessKey || !urlPublica) return null;

	// O endpoint explícito existe para apontar o adaptador a um MinIO local; em
	// produção ele é derivado da conta.
	const endpoint =
		ambiente.R2_ENDPOINT ??
		(conta ? `https://${conta}.r2.cloudflarestorage.com` : undefined);
	if (!endpoint) return null;

	return { endpoint, bucket, accessKeyId, secretAccessKey, urlPublica };
}
