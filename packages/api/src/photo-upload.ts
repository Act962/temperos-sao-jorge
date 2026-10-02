import { getAuth } from "@my-better-t-app/auth";
import {
	DomainError,
	ehChaveDeImagem,
	guardarFotoDeReceita,
	guardarPackshot,
	type ImagemGuardada,
	type ImageServices,
	listarProdutos,
	listarReceitas,
	novaVersaoDeImagem,
	paraSlug,
} from "@my-better-t-app/core";
import { getServicosDeImagem } from "./images";
import { getRepositorios } from "./repos";

/**
 * Envio de fotos pelo painel (spec 0010).
 *
 * Fora do tRPC porque o corpo é um arquivo: em JSON ele viajaria em base64,
 * um terço maior, e o teto de requisição da Vercel é curto.
 *
 * O arquivo chega já reduzido pelo navegador. O tratamento de verdade —
 * recorte da moldura, tamanho final, WebP — é feito aqui, e a resposta traz a
 * chave que o painel grava no produto ou na receita em seguida.
 */

/**
 * Teto do corpo de uma requisição na Vercel. Acima disso a plataforma recusa
 * antes de chegar aqui; conferir de novo dá a mensagem certa também fora dela.
 */
export const LIMITE_DO_CORPO = 4.5 * 1024 * 1024;

const erro = (status: number, message: string) =>
	Response.json({ message }, { status });

const texto = (formulario: FormData, campo: string) => {
	const valor = formulario.get(campo);
	return typeof valor === "string" ? valor.trim() : "";
};

async function exigirSessao(request: Request): Promise<Response | null> {
	const sessao = await getAuth().api.getSession({ headers: request.headers });
	return sessao ? null : erro(401, "Entre no painel para enviar fotos.");
}

async function exigirBucket(): Promise<ImageServices | Response> {
	const servicos = await getServicosDeImagem();
	return (
		servicos ??
		erro(503, "O envio de fotos ainda não está configurado neste ambiente.")
	);
}

function guardar(
	servicos: ImageServices,
	formulario: FormData,
	arquivo: File,
	corpo: Uint8Array,
): Promise<ImagemGuardada> {
	const envio = {
		contentType: arquivo.type,
		corpo,
		versao: novaVersaoDeImagem(),
	};

	// O nome vira slug só para a chave ficar legível no bucket. Quem identifica
	// a foto é a chave inteira, gravada no produto — o slug dele pode até ser
	// outro.
	const slug = paraSlug(texto(formulario, "nome"));

	if (texto(formulario, "alvo") === "receita") {
		return guardarFotoDeReceita(servicos, { ...envio, slug });
	}

	return guardarPackshot(servicos, {
		...envio,
		slug,
		familySlug: texto(formulario, "familia"),
	});
}

export async function receberFoto(request: Request): Promise<Response> {
	const semSessao = await exigirSessao(request);
	if (semSessao) return semSessao;

	const servicos = await exigirBucket();
	if (servicos instanceof Response) return servicos;

	if (Number(request.headers.get("content-length") ?? 0) > LIMITE_DO_CORPO) {
		return erro(413, "A foto ficou grande demais para enviar.");
	}

	const formulario = await request.formData().catch(() => null);
	const arquivo = formulario?.get("arquivo");
	if (!formulario || !(arquivo instanceof File)) {
		return erro(400, "Nenhum arquivo foi enviado.");
	}

	try {
		const corpo = new Uint8Array(await arquivo.arrayBuffer());
		const guardada = await guardar(servicos, formulario, arquivo, corpo);

		return Response.json({
			key: guardada.key,
			url: servicos.storage.urlPublica(guardada.key),
		});
	} catch (falha) {
		if (falha instanceof DomainError) return erro(400, falha.message);

		// O que sobra é o `sharp` recusando o arquivo ou o bucket fora do ar. A
		// mensagem do erro não vai para a tela: pode trazer endereço de
		// infraestrutura.
		console.error("[fotos] falha ao guardar", falha);
		return erro(
			500,
			"Não foi possível tratar esta foto. Confira se o arquivo abre normalmente e tente de novo.",
		);
	}
}

/**
 * Desfaz um envio que não chegou a ser usado — a foto subiu, mas a gravação do
 * produto falhou em seguida.
 *
 * Só apaga chave que nenhum produto e nenhuma receita usa: sem essa
 * conferência, a rota serviria para tirar do ar a foto de qualquer item.
 */
export async function descartarFoto(request: Request): Promise<Response> {
	const semSessao = await exigirSessao(request);
	if (semSessao) return semSessao;

	const servicos = await exigirBucket();
	if (servicos instanceof Response) return servicos;

	const corpo: unknown = await request.json().catch(() => null);
	const key =
		typeof corpo === "object" && corpo !== null && "key" in corpo
			? corpo.key
			: null;
	if (typeof key !== "string" || !ehChaveDeImagem(key)) {
		return erro(400, "Informe a chave da foto.");
	}

	const repos = getRepositorios();
	const [produtos, receitas] = await Promise.all([
		listarProdutos(repos.products),
		listarReceitas(repos.recipes),
	]);
	if ([...produtos, ...receitas].some((item) => item.image === key)) {
		return erro(409, "Esta foto está em uso e não pode ser descartada.");
	}

	await servicos.storage.remover(key);
	return Response.json({ key });
}
