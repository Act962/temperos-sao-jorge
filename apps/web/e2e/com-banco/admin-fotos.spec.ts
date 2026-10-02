import { FOTO_DE_RECEITA, PACKSHOT } from "@my-better-t-app/core";
import {
	type APIRequestContext,
	expect,
	type Page,
	test,
} from "@playwright/test";
import sharp from "sharp";
import { PRODUCTS } from "../../src/data/products";
import { RECIPES } from "../../src/data/recipes";

/**
 * Envio de fotos pelo painel, de ponta a ponta (spec 0010).
 *
 * Precisa de um bucket: as variáveis `R2_*` apontando para um MinIO local ou
 * o do CI. Sem elas a suíte se pula, como os testes do adaptador em
 * `packages/media` — quem só mexe no site não precisa subir um bucket.
 */

const temBucket = Boolean(process.env.R2_BUCKET && process.env.R2_PUBLIC_URL);
const BASE = (process.env.R2_PUBLIC_URL ?? "").replace(/\/+$/, "");

test.skip(!temBucket, "sem bucket configurado (variáveis R2_*)");

/** Um produto opaco pequeno no meio de muita transparência, como os originais. */
async function packshotOriginal(lado = 5000, conteudo = 2600): Promise<Buffer> {
	const produto = await sharp({
		create: {
			width: conteudo,
			height: conteudo,
			channels: 4,
			background: { r: 200, g: 30, b: 40, alpha: 1 },
		},
	})
		.png()
		.toBuffer();

	return sharp({
		create: {
			width: lado,
			height: lado,
			channels: 4,
			background: { r: 0, g: 0, b: 0, alpha: 0 },
		},
	})
		.composite([{ input: produto, gravity: "centre" }])
		.png()
		.toBuffer();
}

async function fotografia(largura = 3000, altura = 2000): Promise<Buffer> {
	return sharp({
		create: {
			width: largura,
			height: altura,
			channels: 3,
			background: { r: 190, g: 120, b: 60 },
		},
	})
		.jpeg()
		.toBuffer();
}

function enviar(
	request: APIRequestContext,
	campos: Record<string, string>,
	arquivo: { name: string; mimeType: string; buffer: Buffer },
) {
	return request.post("/api/admin/fotos", {
		multipart: { ...campos, arquivo },
	});
}

test.describe("a rota de envio", () => {
	test("recusa quem não tem sessão, sem guardar nada", async ({
		playwright,
		baseURL,
	}) => {
		// Sessão vazia explícita: sem isso o contexto novo herda a do projeto, e
		// o teste passaria a conferir o contrário do que diz.
		const anonimo = await playwright.request.newContext({
			baseURL,
			storageState: { cookies: [], origins: [] },
		});

		const resposta = await enviar(
			anonimo,
			{ alvo: "produto", familia: "chas", nome: "Sem Sessão" },
			{
				name: "foto.png",
				mimeType: "image/png",
				buffer: await packshotOriginal(400, 200),
			},
		);
		expect(resposta.status()).toBe(401);

		const descarte = await anonimo.delete("/api/admin/fotos", {
			data: { key: "products/chas/qualquer.webp" },
		});
		expect(descarte.status()).toBe(401);

		await anonimo.dispose();
	});

	test("PNG de 5000 px com moldura vira WebP de 600 px recortado ao produto", async ({
		request,
	}) => {
		const resposta = await enviar(
			request,
			{ alvo: "produto", familia: "chas", nome: "Chá de Teste" },
			{
				name: "original.png",
				mimeType: "image/png",
				buffer: await packshotOriginal(),
			},
		);
		expect(resposta.status(), await resposta.text()).toBe(200);

		const { key, url } = await resposta.json();
		// A versão entra depois do slug: foto nova, endereço novo.
		expect(key).toMatch(/^products\/chas\/cha-de-teste-[a-z0-9]+\.webp$/);
		expect(url).toBe(`${BASE}/${key}`);

		const publicada = await request.get(url);
		expect(publicada.status()).toBe(200);
		expect(publicada.headers()["content-type"]).toBe("image/webp");
		expect(publicada.headers()["cache-control"]).toContain("immutable");

		const imagem = sharp(await publicada.body());
		const meta = await imagem.metadata();
		expect(meta.format).toBe("webp");
		expect(meta.width).toBe(PACKSHOT.maiorAresta);
		expect(meta.height).toBe(PACKSHOT.maiorAresta);

		// Recortado: logo depois da margem já é produto, não moldura vazia.
		const { data, info } = await imagem
			.ensureAlpha()
			.raw()
			.toBuffer({ resolveWithObject: true });
		const opaco = (x: number, y: number) =>
			data[(y * info.width + x) * info.channels + 3] !== 0;
		expect(opaco(PACKSHOT.margem + 6, info.height / 2)).toBe(true);
		expect(opaco(2, 2)).toBe(false);

		// Não chegou a ser usada por produto nenhum: pode ser descartada.
		const descarte = await request.delete("/api/admin/fotos", {
			data: { key },
		});
		expect(descarte.status()).toBe(200);
		expect((await request.get(url)).status()).not.toBe(200);
	});

	test("foto de receita encolhe para 1600 px, sem recorte nem margem", async ({
		request,
	}) => {
		const resposta = await enviar(
			request,
			{ alvo: "receita", nome: "Prato de Teste" },
			{
				name: "prato.jpg",
				mimeType: "image/jpeg",
				buffer: await fotografia(),
			},
		);
		expect(resposta.status(), await resposta.text()).toBe(200);

		const { key, url } = await resposta.json();
		expect(key).toMatch(/^recipes\/prato-de-teste-[a-z0-9]+\.webp$/);

		const meta = await sharp(await (await request.get(url)).body()).metadata();
		expect(meta.width).toBe(FOTO_DE_RECEITA.maiorAresta);
		expect(meta.height).toBe(Math.round((FOTO_DE_RECEITA.maiorAresta * 2) / 3));

		await request.delete("/api/admin/fotos", { data: { key } });
	});

	test("recusa arquivo que não é imagem aceita", async ({ request }) => {
		const resposta = await enviar(
			request,
			{ alvo: "produto", familia: "chas", nome: "Documento" },
			{
				name: "contrato.pdf",
				mimeType: "application/pdf",
				buffer: Buffer.from("%PDF-1.4"),
			},
		);

		expect(resposta.status()).toBe(400);
		expect((await resposta.json()).message).toContain("Tipo de arquivo");
	});

	test("recusa imagem corrompida com mensagem que dá para entender", async ({
		request,
	}) => {
		const resposta = await enviar(
			request,
			{ alvo: "produto", familia: "chas", nome: "Quebrada" },
			{
				name: "quebrada.png",
				mimeType: "image/png",
				buffer: Buffer.from("isto não é um PNG"),
			},
		);

		expect(resposta.status()).toBe(500);
		expect((await resposta.json()).message).toContain(
			"Não foi possível tratar esta foto",
		);
	});
});

/**
 * Devolve o campo `image` de um item ao valor da carga inicial.
 *
 * Pela API, e não pela tela: os valores originais são caminhos antigos, que o
 * painel não tem mais como digitar. O formato é o do `httpBatchLink`, o mesmo
 * que o painel usa.
 */
async function restaurar(
	request: APIRequestContext,
	procedimento: "catalog.produtos.atualizar" | "catalog.receitas.atualizar",
	slug: string,
	image: string | null,
) {
	const resposta = await request.post(`/api/trpc/${procedimento}?batch=1`, {
		data: { "0": { slug, dados: { image } } },
	});
	expect(resposta.ok(), await resposta.text()).toBeTruthy();
}

const salvar = (page: Page, nome = "Salvar") =>
	page.getByRole("button", { name: nome, exact: true }).click();

test.describe("foto do produto pela tela", () => {
	// Um produto que já existe, e sempre com alguma foto ao fim de cada passo
	// menos o último: os outros arquivos desta suíte contam produtos e famílias
	// no mesmo banco, e criar ou mover um aqui mudaria a conta deles.
	const PRODUTO = PRODUCTS[0];
	const linha = (page: Page) =>
		page
			.getByRole("list", { name: "Produtos" })
			.getByRole("listitem")
			.filter({ hasText: PRODUTO.name })
			.first();
	const miniatura = (page: Page) => linha(page).locator("img");

	async function abrirEdicao(page: Page) {
		await page.goto(
			`/admin/produtos?busca=${encodeURIComponent(PRODUTO.name)}`,
		);
		await page
			.getByRole("button", { name: `Editar ${PRODUTO.name}`, exact: true })
			.click();

		// O campo só aceita arquivo depois de saber se o bucket está ligado; o
		// botão aparecer é o sinal de que ele já sabe.
		const dialogo = page.getByRole("dialog");
		await expect(
			dialogo.getByRole("button", { name: "Trocar foto" }),
		).toBeVisible();
		return dialogo;
	}

	test.afterEach(async ({ request }) => {
		await restaurar(
			request,
			"catalog.produtos.atualizar",
			PRODUTO.slug,
			PRODUTO.image,
		);
	});

	test("enviar, trocar e remover", async ({ page, request }) => {
		test.setTimeout(90_000);

		// --- enviar -----------------------------------------------------------
		let dialogo = await abrirEdicao(page);
		await dialogo.getByLabel("Foto do produto").setInputFiles({
			name: "original.png",
			mimeType: "image/png",
			buffer: await packshotOriginal(),
		});
		await expect(dialogo.getByText("original.png")).toBeVisible();
		await expect(
			dialogo.getByText("Vai ao ar quando você salvar."),
		).toBeVisible();

		await salvar(page);
		await expect(page.getByText(`"${PRODUTO.name}" atualizado.`)).toBeVisible();

		// A lista mostra a foto nova sem recarregar, vinda do bucket.
		await expect(miniatura(page)).toHaveAttribute(
			"src",
			new RegExp(`^${BASE}/products/${PRODUTO.familySlug}/`),
		);
		const primeira = (await miniatura(page).getAttribute("src")) ?? "";

		// O navegador reduziu os 5000 px e o servidor recortou e fechou em 600.
		const meta = await sharp(
			await (await request.get(primeira)).body(),
		).metadata();
		expect(meta.format).toBe("webp");
		expect(meta.width).toBe(PACKSHOT.maiorAresta);

		// Salvar é publicar: a página da família já usa o endereço novo.
		await page.goto(`/produtos/${PRODUTO.familySlug}`);
		await expect(page.locator(`img[src="${primeira}"]`)).toHaveCount(1);

		// --- trocar -----------------------------------------------------------
		dialogo = await abrirEdicao(page);
		await expect(dialogo.getByText("Foto atual")).toBeVisible();
		await dialogo.getByLabel("Foto do produto").setInputFiles({
			name: "outra.png",
			mimeType: "image/png",
			buffer: await packshotOriginal(1200, 700),
		});
		await salvar(page);
		await expect(page.getByText(`"${PRODUTO.name}" atualizado.`)).toBeVisible();

		await expect(miniatura(page)).not.toHaveAttribute("src", primeira);
		const segunda = (await miniatura(page).getAttribute("src")) ?? "";
		expect(segunda.startsWith(`${BASE}/products/`)).toBe(true);
		// Endereço novo, e a anterior saiu do bucket.
		expect((await request.get(primeira)).status()).not.toBe(200);
		expect((await request.get(segunda)).status()).toBe(200);

		// --- remover ----------------------------------------------------------
		dialogo = await abrirEdicao(page);
		await dialogo.getByRole("button", { name: "Remover foto" }).click();
		await expect(dialogo.getByText("Nenhuma foto ainda")).toBeVisible();
		await salvar(page);
		await expect(page.getByText(`"${PRODUTO.name}" atualizado.`)).toBeVisible();

		await expect(linha(page).getByText("sem foto")).toBeVisible();
		expect((await request.get(segunda)).status()).not.toBe(200);

		await page.goto("/admin");
		await expect(page.getByText("1 produto sem foto")).toBeVisible();
	});

	test("arquivo que não é imagem é recusado na hora, antes de salvar", async ({
		page,
	}) => {
		const dialogo = await abrirEdicao(page);

		await dialogo.getByLabel("Foto do produto").setInputFiles({
			name: "catalogo.pdf",
			mimeType: "application/pdf",
			buffer: Buffer.from("%PDF-1.4"),
		});

		await expect(dialogo.getByRole("alert")).toContainText("catalogo.pdf");
		// A foto do produto continua a que estava.
		await expect(dialogo.getByText("Foto atual")).toBeVisible();
	});
});

test.describe("foto da receita pela tela", () => {
	const RECEITA = RECIPES[0];

	test.afterEach(async ({ request }) => {
		await restaurar(
			request,
			"catalog.receitas.atualizar",
			RECEITA.slug,
			RECEITA.image === "" ? null : RECEITA.image,
		);

		// Trocar só a foto não pode levar o resto junto: uma alteração parcial
		// já apagou o resumo e os produtos citados, por causa dos valores padrão
		// do schema de entrada.
		const consulta = await request.get(
			`/api/trpc/catalog.receitas.obter?batch=1&input=${encodeURIComponent(
				JSON.stringify({ "0": { slug: RECEITA.slug } }),
			)}`,
		);
		const [{ result }] = await consulta.json();
		expect(result.data.summary).toBe(RECEITA.summary);
		expect(result.data.usedProductSlugs).toEqual(RECEITA.usedProductSlugs);
	});

	test("a foto enviada aparece na página da receita", async ({
		page,
		request,
	}) => {
		test.setTimeout(60_000);

		await page.goto(`/admin/receitas/${RECEITA.slug}`);
		// Mesmo motivo do diálogo de produto: espera o campo saber do bucket.
		await expect(
			page.getByRole("button", { name: "Trocar foto" }),
		).toBeVisible();
		await page.getByLabel("Foto do prato").setInputFiles({
			name: "prato.jpg",
			mimeType: "image/jpeg",
			buffer: await fotografia(),
		});
		await salvar(page, "Salvar receita");
		await expect(page.getByText(`"${RECEITA.name}" atualizada.`)).toBeVisible();

		// O campo larga o arquivo enviado e passa a mostrar a foto do bucket.
		await expect(page.getByText("Foto atual")).toBeVisible();

		await page.goto(`/receitas/${RECEITA.slug}`);
		const foto = page.locator(`img[src^="${BASE}/recipes/${RECEITA.slug}-"]`);
		await expect(foto).toHaveCount(1);

		const meta = await sharp(
			await (await request.get((await foto.getAttribute("src")) ?? "")).body(),
		).metadata();
		expect(meta.width).toBe(FOTO_DE_RECEITA.maiorAresta);
	});
});
