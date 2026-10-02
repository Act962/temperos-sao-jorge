import type { ImageServices } from "@my-better-t-app/core";

/**
 * As fotos, ligadas ao mundo real (spec 0010).
 *
 * Tudo aqui é opcional: sem as variáveis `R2_*` o site e o painel funcionam
 * como antes, só sem enviar foto.
 */

/**
 * Endereço público do bucket, para transformar chave em endereço.
 *
 * Lê só a variável, sem carregar cliente nenhum: é chamada a cada leitura do
 * catálogo pelo site público, que não tem por que conhecer o SDK do S3.
 */
export function baseDasImagens(): string | null {
	return process.env.R2_PUBLIC_URL?.trim() || null;
}

let servicos: Promise<ImageServices | null> | undefined;

/**
 * Bucket e tratamento, ou `null` quando o bucket não está configurado.
 *
 * `sharp` é binário nativo e o cliente S3 é grande; os dois entram por
 * `import()` dinâmico para só existirem em quem envia ou apaga foto. Uma
 * falha ao carregar não fica guardada: a chamada seguinte tenta de novo.
 */
export function getServicosDeImagem(): Promise<ImageServices | null> {
	servicos ??= carregar().catch((erro) => {
		servicos = undefined;
		throw erro;
	});
	return servicos;
}

async function carregar(): Promise<ImageServices | null> {
	const { configuracaoDoAmbiente } = await import(
		"@my-better-t-app/media/config"
	);
	const config = configuracaoDoAmbiente();
	if (!config) return null;

	const [{ R2ImageStorage }, { SharpImageProcessor }] = await Promise.all([
		import("@my-better-t-app/media/r2-storage"),
		import("@my-better-t-app/media/sharp-processor"),
	]);

	return {
		storage: new R2ImageStorage(config),
		processor: new SharpImageProcessor(),
	};
}

/** O envio de fotos está ligado? Não carrega o SDK para responder. */
export async function envioDeFotosLigado(): Promise<boolean> {
	const { configuracaoDoAmbiente } = await import(
		"@my-better-t-app/media/config"
	);
	return configuracaoDoAmbiente() !== null;
}
