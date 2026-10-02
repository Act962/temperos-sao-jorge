/**
 * O caminho de uma foto do painel até o bucket (spec 0010).
 *
 * A foto é escolhida no formulário e só sobe quando ele é salvo. Antes de
 * subir, o navegador a reduz: a Vercel recusa requisição acima de 4,5 MB e os
 * originais da marca têm de 3 a 9 MB. O tratamento de verdade — recorte da
 * moldura, tamanho final, WebP — continua no servidor.
 */

/** A foto de um item em edição: a que está salva e a que foi escolhida agora. */
export interface ValorDaFoto {
	/** O que está em `image` hoje — caminho antigo, chave do bucket ou vazio. */
	atual: string;
	/** Arquivo escolhido e ainda não enviado. */
	nova: File | null;
}

export interface LimitesDeFoto {
	tipos: readonly string[];
	tamanhoMaximo: number;
}

/**
 * Lados máximos tentados, do maior para o menor. 2000 px sobra para os 600 px
 * do packshot e os 1600 px da receita; os seguintes só entram quando a foto
 * reduzida ainda não cabe no envio.
 */
export const LADOS_DE_ENVIO = [2000, 1500, 1100] as const;

/** Abaixo do teto de 4,5 MB da Vercel, com folga para o resto do formulário. */
export const LIMITE_DE_ENVIO = 4 * 1024 * 1024;

const megabytes = (bytes: number) =>
	(bytes / 1024 / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 1 });

/**
 * Confere o arquivo na hora em que é escolhido. Devolve a mensagem para a
 * tela, ou `null` quando o arquivo serve.
 *
 * Os limites vêm do servidor, que os lê do domínio: a tela não tem número
 * próprio para ficar desatualizado.
 */
export function conferirArquivo(
	arquivo: { name: string; type: string; size: number },
	limites: LimitesDeFoto,
): string | null {
	if (!limites.tipos.includes(arquivo.type)) {
		return `${arquivo.name} não é uma imagem aceita. Envie PNG, JPG ou WebP.`;
	}

	if (arquivo.size > limites.tamanhoMaximo) {
		return `${arquivo.name} tem ${megabytes(arquivo.size)} MB. O limite é ${megabytes(limites.tamanhoMaximo)} MB.`;
	}

	return null;
}

/** Encolhe para caber em `lado`, mantendo a proporção. Nunca amplia. */
export function dimensoesReduzidas(
	largura: number,
	altura: number,
	lado: number,
): { largura: number; altura: number } {
	const escala = Math.min(1, lado / Math.max(largura, altura));
	return {
		largura: Math.max(1, Math.round(largura * escala)),
		altura: Math.max(1, Math.round(altura * escala)),
	};
}

/**
 * JPEG continua JPEG; o resto vira PNG. PNG e WebP podem ter transparência, e
 * é ela que o servidor recorta no packshot — convertê-los para JPEG pintaria
 * o fundo de preto.
 */
export function tipoDeEnvio(tipoOriginal: string): "image/jpeg" | "image/png" {
	return tipoOriginal === "image/jpeg" ? "image/jpeg" : "image/png";
}

function desenhar(
	imagem: ImageBitmap,
	lado: number,
	tipo: string,
): Promise<Blob | null> {
	const { largura, altura } = dimensoesReduzidas(
		imagem.width,
		imagem.height,
		lado,
	);
	const tela = document.createElement("canvas");
	tela.width = largura;
	tela.height = altura;
	tela.getContext("2d")?.drawImage(imagem, 0, 0, largura, altura);

	return new Promise((resolver) => tela.toBlob(resolver, tipo, 0.9));
}

/**
 * Deixa a foto num tamanho que o envio aceita.
 *
 * Foto que já é pequena, em pixels e em bytes, segue como está: redesenhar
 * só perderia qualidade.
 */
export async function reduzirFoto(arquivo: File): Promise<Blob> {
	const imagem = await createImageBitmap(arquivo, {
		imageOrientation: "from-image",
	}).catch(() => {
		throw new Error(
			`Não foi possível abrir ${arquivo.name}. Confira se o arquivo é mesmo uma imagem.`,
		);
	});

	try {
		const cabe =
			arquivo.size <= LIMITE_DE_ENVIO &&
			Math.max(imagem.width, imagem.height) <= LADOS_DE_ENVIO[0];
		if (cabe) return arquivo;

		const tipo = tipoDeEnvio(arquivo.type);
		for (const lado of LADOS_DE_ENVIO) {
			const reduzida = await desenhar(imagem, lado, tipo);
			if (reduzida && reduzida.size <= LIMITE_DE_ENVIO) return reduzida;
		}
	} finally {
		imagem.close();
	}

	throw new Error(
		`${arquivo.name} continua grande demais mesmo reduzida. Tente uma versão menor da foto.`,
	);
}

export type DestinoDaFoto =
	| { alvo: "produto"; familia: string; nome: string }
	| { alvo: "receita"; nome: string };

async function mensagemDoErro(resposta: Response): Promise<string> {
	const corpo: unknown = await resposta.json().catch(() => null);
	if (
		typeof corpo === "object" &&
		corpo !== null &&
		"message" in corpo &&
		typeof corpo.message === "string"
	) {
		return corpo.message;
	}
	return "Não foi possível enviar a foto. Tente de novo.";
}

async function enviarFoto(arquivo: File, destino: DestinoDaFoto) {
	const reduzida = await reduzirFoto(arquivo);

	const formulario = new FormData();
	formulario.set("alvo", destino.alvo);
	formulario.set("nome", destino.nome);
	if (destino.alvo === "produto") formulario.set("familia", destino.familia);
	formulario.set("arquivo", reduzida, arquivo.name);

	const resposta = await fetch("/api/admin/fotos", {
		method: "POST",
		body: formulario,
	});
	if (!resposta.ok) throw new Error(await mensagemDoErro(resposta));

	const { key } = (await resposta.json()) as { key: string };
	return key;
}

export interface FotoResolvida {
	/** O que gravar em `image`. */
	image: string | null;
	/** Chave enviada agora, para desfazer se a gravação falhar. */
	enviada: string | null;
}

/**
 * Transforma o que está no campo no valor de `image`, enviando a foto nova se
 * houver uma.
 */
export async function resolverFoto(
	valor: ValorDaFoto,
	destino: DestinoDaFoto,
): Promise<FotoResolvida> {
	if (valor.nova === null) {
		return { image: valor.atual === "" ? null : valor.atual, enviada: null };
	}

	const key = await enviarFoto(valor.nova, destino);
	return { image: key, enviada: key };
}

/**
 * Apaga a foto que subiu quando a gravação do item falhou em seguida.
 *
 * Sem esperar e sem reclamar: é limpeza. Se falhar, sobra um arquivo no
 * bucket que ninguém vê, e a pessoa já está lendo o erro que importa.
 */
export function descartarFoto(key: string | null): void {
	if (key === null) return;

	void fetch("/api/admin/fotos", {
		method: "DELETE",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ key }),
	}).catch(() => undefined);
}
