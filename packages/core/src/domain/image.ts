import { InvalidInputError } from "./errors";
import { comoSlug, type Slug } from "./slug";

/**
 * Onde uma foto mora, do ponto de vista do domínio.
 *
 * É só a chave — `products/chas/sachet-melissa.webp`. O host do CDN é
 * configuração, e quem monta a URL pública é o adaptador. Guardar o endereço
 * aqui faria trocar de provedor virar mudança de regra de negócio.
 *
 * O formato é o caminho que o site já usa hoje menos o prefixo `/images/`, de
 * propósito: a migração vira uma transformação de string, e durante a
 * transição a mesma chave descreve os dois mundos.
 */
export type ImageKey = string & { readonly __marca: "ImageKey" };

/** Pastas de primeiro nível. Fechada porque chave solta vira lixo no bucket. */
export const PASTAS_DE_IMAGEM = ["products", "recipes", "editorial"] as const;
export type PastaDeImagem = (typeof PASTAS_DE_IMAGEM)[number];

const FORMATO =
	/^(products|recipes|editorial)\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)?\.webp$/;

export function ehChaveDeImagem(valor: string): valor is ImageKey {
	return FORMATO.test(valor);
}

export function comoChaveDeImagem(valor: string): ImageKey {
	if (!ehChaveDeImagem(valor)) {
		throw new InvalidInputError(
			`Chave de imagem inválida: "${valor}". Esperado <pasta>/<slug>.webp ou <pasta>/<slug>/<slug>.webp, com pasta em ${PASTAS_DE_IMAGEM.join(", ")}.`,
		);
	}
	return valor;
}

/**
 * Sufixo que distingue um envio do anterior: `sachet-melissa-m3k9x2`.
 *
 * As fotos são guardadas com cache de um ano, imutável. Sem a versão, trocar a
 * foto de um produto manteria o endereço, e quem já visitou o site continuaria
 * vendo a antiga. Com ela, foto nova é endereço novo (spec 0010).
 */
function comVersao(slug: string, versao: string | undefined): string {
	if (versao === undefined) return comoSlug(slug);

	if (!/^[a-z0-9]+$/.test(versao)) {
		throw new InvalidInputError(
			`Versão de imagem inválida: "${versao}". Use só minúsculas e números.`,
		);
	}
	return `${comoSlug(slug)}-${versao}`;
}

/** `products/chas/sachet-melissa.webp` — a família fica no caminho. */
export function chaveDePackshot(
	familySlug: string,
	slug: string,
	versao?: string,
): ImageKey {
	return `products/${comoSlug(familySlug)}/${comVersao(slug, versao)}.webp` as ImageKey;
}

/** `recipes/arroz-a-grega.webp` — receita não tem família. */
export function chaveDeReceita(slug: string, versao?: string): ImageKey {
	return `recipes/${comVersao(slug, versao)}.webp` as ImageKey;
}

/**
 * O que o campo `image` de um produto ou de uma receita pode guardar.
 *
 * Dois mundos convivem (spec 0010): o caminho antigo, servido de `public/` —
 * `/images/products/chas/sachet-melissa.webp` —, e a chave do bucket, sem
 * barra no começo. É a barra que distingue um do outro.
 */
export function ehCaminhoAntigo(valor: string): boolean {
	return valor.startsWith("/images/");
}

/**
 * O endereço que o navegador pede, a partir do que está guardado em `image`.
 *
 * Caminho antigo sai como está. Chave vira endereço do CDN — e, sem a base
 * configurada, vira vazio: o site mostra o espaço reservado, que é melhor que
 * um endereço que não existe.
 */
export function urlDaImagem(
	valor: string | null | undefined,
	base: string | null | undefined,
): string {
	if (!valor) return "";
	if (ehCaminhoAntigo(valor)) return valor;
	if (!ehChaveDeImagem(valor) || !base) return "";
	return `${base.replace(/\/+$/, "")}/${valor}`;
}

/**
 * A família de um packshot, lida da própria chave.
 *
 * É o que permite recusar um packshot que ficou na pasta de outra família
 * depois que o produto mudou de lugar — a mesma regra que hoje protege o
 * caminho no disco.
 */
export function familiaDaChave(chave: ImageKey): Slug | null {
	const [pasta, familia, arquivo] = chave.split("/");
	if (pasta !== "products" || familia === undefined || arquivo === undefined) {
		return null;
	}
	return comoSlug(familia);
}

/**
 * Tratamento do packshot antes de guardar.
 *
 * Os números são regra, não detalhe de implementação: os originais trazem ~73%
 * de área transparente, o que fazia o sachê renderizar a ~89 px numa caixa de
 * 150 px. Recortar e repadronizar a margem quase dobrou o tamanho aparente sem
 * mudar uma linha de CSS. Quem executa é o adaptador, porque `sharp` é binário
 * nativo e não entra aqui.
 */
export const PACKSHOT = {
	/** Maior aresta, em pixels. Cobre uma peça de 260 px em tela 2x. */
	maiorAresta: 600,
	/** Margem transparente uniforme em volta do produto já recortado. */
	margem: 22,
	qualidadeWebp: 82,
} as const;

/**
 * Tratamento da foto de receita.
 *
 * Foto de prato é fotografia: não tem moldura transparente para recortar e
 * aparece bem maior que um packshot — a página da receita a usa na largura do
 * texto. 1600 px cobre essa largura em tela 2x.
 */
export const FOTO_DE_RECEITA = {
	maiorAresta: 1600,
	qualidadeWebp: 80,
} as const;

export const TIPOS_ACEITOS = [
	"image/png",
	"image/jpeg",
	"image/webp",
	"image/tiff",
] as const;

/**
 * O que o painel oferece no seletor de arquivo. TIFF fica de fora: navegador
 * não abre TIFF, e o painel precisa abrir a foto para reduzi-la antes de
 * enviar.
 */
export const TIPOS_DO_PAINEL = [
	"image/png",
	"image/jpeg",
	"image/webp",
] as const;

/** Os originais da marca têm de 3 a 9 MB; o teto deixa folga sem virar porta. */
export const TAMANHO_MAXIMO = 20 * 1024 * 1024;

export interface EnvioDeImagem {
	contentType: string;
	tamanho: number;
}

/**
 * Confere o que dá para conferir antes de qualquer byte ir para a rede.
 *
 * Um arquivo de 40 MB recusado depois do upload já custou banda de quem
 * enviou, e no R2 custa também requisição paga.
 */
export function validarEnvio(envio: EnvioDeImagem): void {
	const tipo = envio.contentType.split(";")[0]?.trim().toLowerCase() ?? "";

	if (!(TIPOS_ACEITOS as readonly string[]).includes(tipo)) {
		throw new InvalidInputError(
			`Tipo de arquivo não aceito: "${envio.contentType}". Envie ${TIPOS_ACEITOS.join(", ")}.`,
		);
	}

	if (!Number.isFinite(envio.tamanho) || envio.tamanho <= 0) {
		throw new InvalidInputError("O arquivo enviado está vazio.");
	}

	if (envio.tamanho > TAMANHO_MAXIMO) {
		const mb = (envio.tamanho / 1024 / 1024).toFixed(1);
		throw new InvalidInputError(
			`Arquivo de ${mb} MB acima do limite de ${TAMANHO_MAXIMO / 1024 / 1024} MB.`,
		);
	}
}
