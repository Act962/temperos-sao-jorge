import { CONTEUDO_PADRAO } from "@my-better-t-app/core";
import { expect, type Page, test } from "@playwright/test";
import { PRODUCT_FAMILIES, PRODUCTS } from "../../src/data/products";

/**
 * Configurações e textos das páginas, do painel até o site (spec 0008).
 *
 * Cada teste edita um documento, confere o site público na mesma rodada —
 * salvar é publicar — e devolve o documento como estava. O preparo zera a
 * tabela de conteúdo, então o ponto de partida é sempre o padrão de
 * `@my-better-t-app/core`, que é de onde vêm as expectativas.
 */

const PADRAO = CONTEUDO_PADRAO;

const secao = (page: Page, nome: string) =>
	page.getByRole("region", { name: nome });

async function salvar(page: Page) {
	await page.getByRole("button", { name: "Salvar", exact: true }).click();
	await expect(page.getByText("Tudo salvo.")).toBeVisible();
}

/** O HTML que o servidor entrega a um visitante novo, sem cache do navegador. */
async function html(page: Page, caminho: string) {
	const resposta = await page.request.get(caminho);
	expect(resposta.status()).toBe(200);
	return resposta.text();
}

test("sem nada salvo, o site mostra o conteúdo padrão", async ({ page }) => {
	await page.goto("/");

	await expect(page.getByRole("contentinfo")).toContainText(
		PADRAO.settings.contact.phone,
	);
	await expect(
		page.getByRole("heading", { name: PADRAO.home.story.title }),
	).toBeVisible();

	// A contagem dos compromissos sai do catálogo, não de um número escrito.
	const compromissos = page.getByRole("region", {
		name: "Compromissos da São Jorge Alimentos",
	});
	await expect(compromissos).toContainText(
		`${PRODUCTS.length} produtos em ${PRODUCT_FAMILIES.length} famílias`,
	);
	await expect(compromissos).not.toContainText("{produtos}");

	// Endereço ainda não conferido: nada de LocalBusiness para o Google.
	expect(await html(page, "/contato")).not.toContain("FoodEstablishment");
});

test("telefone alterado em Configurações aparece no rodapé e no Contato", async ({
	page,
}) => {
	const novo = "(86) 3221-4455";

	await page.goto("/admin/configuracoes");
	const telefone = secao(page, "Contato").getByLabel("Telefone");
	await expect(telefone).toHaveValue(PADRAO.settings.contact.phone);

	// Sem alteração não há o que salvar.
	await expect(
		page.getByRole("button", { name: "Salvar", exact: true }),
	).toBeDisabled();

	await telefone.fill(novo);
	await expect(page.getByText("Há alterações não salvas.")).toBeVisible();
	await salvar(page);

	expect(await html(page, "/")).toContain(novo);
	const contato = await html(page, "/contato");
	expect(contato).toContain(novo);
	expect(contato).toContain('href="tel:+558632214455"');

	// Sobrevive ao recarregar: está no banco, não só na tela.
	await page.reload();
	await expect(telefone).toHaveValue(novo);

	await telefone.fill(PADRAO.settings.contact.phone);
	await salvar(page);
	expect(await html(page, "/")).not.toContain(novo);
});

test("WhatsApp em branco esconde o botão do site", async ({ page }) => {
	expect(await html(page, "/")).toContain("wa.me/");

	await page.goto("/admin/configuracoes");
	const numero = secao(page, "WhatsApp").getByLabel("Número do WhatsApp");
	await numero.fill("");
	await salvar(page);

	expect(await html(page, "/")).not.toContain("wa.me/");

	await numero.fill(PADRAO.settings.whatsapp.number);
	await salvar(page);
	expect(await html(page, "/")).toContain("wa.me/");
});

test("o domínio recusa e-mail e rede social inválidos, na própria tela", async ({
	page,
}) => {
	await page.goto("/admin/configuracoes");

	const email = secao(page, "Contato").getByLabel("E-mail");
	// O navegador aceita e-mail sem domínio completo; quem recusa é o domínio.
	await email.fill("sac@saojorge");
	await page.getByRole("button", { name: "Salvar", exact: true }).click();
	await expect(page.getByRole("alert")).toContainText(
		"E-mail de contato inválido",
	);
	await email.fill(PADRAO.settings.contact.email);

	const instagram = secao(page, "Redes sociais").getByLabel("Instagram");
	// `http://` passa pela validação do navegador, e o domínio exige `https://`.
	await instagram.fill("http://www.instagram.com/saojorge");
	await page.getByRole("button", { name: "Salvar", exact: true }).click();
	await expect(page.getByRole("alert")).toContainText(
		"endereço completo do perfil",
	);

	// Nada foi gravado: o site continua com o padrão.
	await page.getByRole("button", { name: "Descartar" }).click();
	await expect(instagram).toHaveValue(PADRAO.settings.social[0]?.href ?? "");
});

test("endereço conferido passa a ser informado ao Google", async ({ page }) => {
	await page.goto("/admin/configuracoes");
	const conferido = page.getByLabel("O endereço acima é o verdadeiro");

	await conferido.check();
	await salvar(page);
	expect(await html(page, "/contato")).toContain("FoodEstablishment");

	await conferido.uncheck();
	await salvar(page);
	expect(await html(page, "/contato")).not.toContain("FoodEstablishment");
});

test("título da abertura e representante da família mudam a home", async ({
	page,
}) => {
	const familia = PRODUCT_FAMILIES[0];
	const daFamilia = PRODUCTS.filter((p) => p.familySlug === familia.slug);
	const padrao = PADRAO.home.families.representatives[familia.slug];
	const outro = daFamilia.find((p) => p.slug !== padrao);
	if (!outro) throw new Error("a família de referência precisa de 2 produtos");

	await page.goto("/admin/inicio");

	const titulo = secao(page, "Abertura").getByLabel("Título");
	await titulo.fill("Tempero bom\nde verdade");

	const representante = secao(page, "Famílias de produtos").getByLabel(
		familia.name,
		{ exact: true },
	);
	await representante.selectOption(outro.slug);
	await salvar(page);

	await page.goto("/");
	await expect(page.getByRole("heading", { level: 1 })).toContainText(
		"Tempero bom",
	);
	await expect(page.getByRole("heading", { level: 1 })).toContainText(
		"de verdade",
	);
	// O carrossel passa a mostrar a foto do produto escolhido.
	await expect(
		page.getByAltText(`${outro.name} — linha ${familia.name}`, {
			exact: false,
		}),
	).toHaveCount(1);

	await page.goto("/admin/inicio");
	await titulo.fill(PADRAO.home.hero.title);
	await representante.selectOption(padrao ?? "");
	await salvar(page);
	expect(await html(page, "/")).not.toContain("Tempero bom");
});

test("a home exige os quatro compromissos preenchidos", async ({ page }) => {
	await page.goto("/admin/inicio");

	const compromissos = secao(page, "Compromissos da marca");
	// Quantidade fixa: a tela não oferece adicionar nem remover.
	await expect(
		compromissos.getByRole("button", { name: /Adicionar|Remover/ }),
	).toHaveCount(0);

	await compromissos.getByLabel("Título").first().fill("");
	await page.getByRole("button", { name: "Salvar", exact: true }).click();
	await expect(page.getByRole("alert")).toContainText(
		"O compromisso 1 precisa de título",
	);
});

test("marco acrescentado à linha do tempo aparece na página Sobre", async ({
	page,
}) => {
	const total = PADRAO.about.timeline.length;

	await page.goto("/admin/sobre");
	const linha = secao(page, "Linha do tempo");

	await linha.getByRole("button", { name: "Adicionar marco" }).click();
	const novo = linha.getByRole("listitem").nth(total);
	await novo.getByLabel("Ano").fill("2026");
	await novo.getByLabel("Título").fill("Painel no ar");
	await novo.getByLabel("Texto").fill("O site passa a ser editado pela marca.");

	// Sobe uma posição: o marco fica antes do "Atualmente".
	await linha.getByRole("button", { name: `Subir marco ${total + 1}` }).click();
	await salvar(page);

	const sobre = await html(page, "/sobre");
	expect(sobre).toContain("Painel no ar");
	expect(sobre.indexOf("Painel no ar")).toBeLessThan(
		sobre.indexOf(PADRAO.about.timeline[total - 1]?.title ?? ""),
	);

	await linha.getByRole("button", { name: `Remover marco ${total}` }).click();
	await salvar(page);
	expect(await html(page, "/sobre")).not.toContain("Painel no ar");
});

test("texto alterado na política de privacidade aparece na página", async ({
	page,
}) => {
	const frase = "Parágrafo acrescentado pelo teste do painel.";

	await page.goto("/admin/privacidade");
	const primeira = secao(page, "Seções").getByRole("listitem").first();
	const texto = primeira.getByLabel("Texto", { exact: true });
	const original = await texto.inputValue();

	await texto.fill(`${original}\n\n${frase}`);
	await salvar(page);

	// O HTML de toda página carrega o conteúdo inteiro para a hidratação, então
	// a conferência é no que a página exibe, não no texto bruto da resposta.
	await page.goto("/privacidade");
	await expect(page.getByRole("article")).toContainText(frase);
	// A política de cookies é outro documento e não muda junto.
	await page.goto("/cookies");
	await expect(page.getByRole("article")).not.toContainText(frase);
	await page.goto("/admin/privacidade");

	await texto.fill(original);
	await salvar(page);
	expect(await html(page, "/privacidade")).not.toContain(frase);
});
