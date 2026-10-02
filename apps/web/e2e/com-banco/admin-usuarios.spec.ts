import { expect, test } from "@playwright/test";

/**
 * Usuários do painel e o fechamento do cadastro público (spec 0009).
 *
 * O preparo cria o usuário da automação pelo cadastro do site — que só
 * funciona porque o banco estava vazio. Daqui em diante esse caminho tem que
 * estar fechado, e conta nova só nasce pela tela.
 */

const NOVO = {
	name: "Usuária de Teste do E2E",
	email: "teste-e2e@alimentossaojorge.com",
	password: "senha-da-usuaria-de-teste",
};

test("com um usuário cadastrado, o cadastro pelo site responde 403", async ({
	page,
}) => {
	const resposta = await page.request.post("/api/auth/sign-up/email", {
		data: {
			name: "Intruso",
			email: "intruso@example.com",
			password: "qualquer-senha-longa",
		},
		failOnStatusCode: false,
	});

	expect(resposta.status()).toBe(403);

	// E nenhuma conta foi criada.
	await page.goto("/admin/usuarios");
	await expect(page.getByText("intruso@example.com")).toHaveCount(0);
});

test("a própria conta não pode ser removida, só trocar a senha", async ({
	page,
}) => {
	await page.goto("/admin/usuarios");

	const eu = page
		.getByRole("list", { name: "Usuários" })
		.getByRole("listitem")
		.filter({ hasText: "você" });

	await expect(eu).toHaveCount(1);
	await expect(eu.getByRole("button", { name: /^Remover/ })).toHaveCount(0);
	await expect(
		eu.getByRole("button", { name: "Trocar minha senha" }),
	).toBeVisible();
});

test("usuário criado pela tela entra no painel, e removido não entra mais", async ({
	page,
	playwright,
	baseURL,
}) => {
	/** Tenta entrar como o usuário novo e devolve o status da resposta. */
	const entrar = async () => {
		// Contexto próprio: a sessão da automação não pode se misturar.
		// Com `Origin`, como todo navegador manda num POST — sem ele o
		// Better-Auth recusa a requisição antes de olhar a senha.
		const visitante = await playwright.request.newContext({
			baseURL,
			extraHTTPHeaders: { origin: baseURL ?? "" },
		});
		const resposta = await visitante.post("/api/auth/sign-in/email", {
			data: { email: NOVO.email, password: NOVO.password },
			failOnStatusCode: false,
		});
		const status = resposta.status();
		await visitante.dispose();
		return status;
	};

	await page.goto("/admin/usuarios");
	const dialogo = page.getByRole("dialog");
	const remover = async () => {
		await page.getByRole("button", { name: `Remover ${NOVO.name}` }).click();
		await page
			.getByRole("alertdialog")
			.getByRole("button", { name: "Remover" })
			.click();
		await expect(page.getByText(NOVO.email)).toHaveCount(0);
	};

	// A carga do preparo não mexe nos usuários: se uma rodada anterior caiu
	// no meio, a conta de teste ficou no banco e este teste falharia para
	// sempre em "e-mail já cadastrado".
	await expect(page.getByRole("list", { name: "Usuários" })).toBeVisible();
	if ((await page.getByText(NOVO.email).count()) > 0) await remover();

	// Senha curta: regra do domínio, dentro do diálogo.
	await page.getByRole("button", { name: "Novo usuário" }).click();
	await dialogo.getByLabel("Nome").fill(NOVO.name);
	await dialogo.getByLabel("E-mail").fill(NOVO.email);
	await dialogo.getByLabel("Senha").fill("1234567");
	await dialogo.getByRole("button", { name: "Criar acesso" }).click();
	await expect(dialogo.getByRole("alert")).toContainText(
		"pelo menos 8 caracteres",
	);

	await dialogo.getByLabel("Senha").fill(NOVO.password);
	await dialogo.getByRole("button", { name: "Criar acesso" }).click();
	await expect(dialogo).toHaveCount(0);
	await expect(page.getByText(NOVO.email)).toBeVisible();

	expect(await entrar(), "o usuário novo deve conseguir entrar").toBe(200);

	// O mesmo e-mail de novo é recusado.
	await page.getByRole("button", { name: "Novo usuário" }).click();
	await dialogo.getByLabel("Nome").fill("Outra pessoa");
	await dialogo.getByLabel("E-mail").fill(NOVO.email.toUpperCase());
	await dialogo.getByLabel("Senha").fill(NOVO.password);
	await dialogo.getByRole("button", { name: "Criar acesso" }).click();
	await expect(dialogo.getByRole("alert")).toContainText(
		"Já existe um usuário com o e-mail",
	);
	await dialogo.getByRole("button", { name: "Cancelar" }).click();

	await remover();

	expect(await entrar(), "o usuário removido não deve mais entrar").toBe(401);
});
