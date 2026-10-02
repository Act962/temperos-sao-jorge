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
 * Monta a configuração a partir do ambiente.
 *
 * Fica aqui, e não em `packages/env`, porque as variáveis são opcionais: o
 * site e o painel funcionam sem bucket, e exigi-las no schema compartilhado
 * quebraria todo mundo que ainda não tem um.
 *
 * Módulo próprio, sem importar o cliente S3: quem só quer saber se o envio de
 * fotos está ligado não precisa carregar o SDK inteiro para descobrir.
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
		ambiente.R2_ENDPOINT ||
		(conta ? `https://${conta}.r2.cloudflarestorage.com` : undefined);
	if (!endpoint) return null;

	return { endpoint, bucket, accessKeyId, secretAccessKey, urlPublica };
}
