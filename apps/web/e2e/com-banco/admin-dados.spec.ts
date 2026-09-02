import { expect, test } from "@playwright/test";
import { PRODUCT_FAMILIES, PRODUCTS } from "../../src/data/products";
import { RECIPES } from "../../src/data/recipes";

/**
 * O painel lendo e gravando o catálogo de verdade.
 *
 * A suíte sem banco prova que as rotas do admin sobem e barram quem não tem
 * sessão; ela não consegue provar que a tela mostra o dado certo, porque não
 * há dado. É esse buraco que os testes daqui fecham.
 *
 * A expectativa vem dos arquivos publicados em `src/data/`, que são a mesma
 * origem do `catalog:seed`. Assim nenhum número fica escrito à mão: o catálogo
 * pode crescer que o teste acompanha.
 */

const RECEITA = RECIPES[0];

test("a visão geral conta o que está no banco", async ({ page }) => {
	await page.goto("/admin");

	const cartao = (rotulo: string) => page.getByRole("group", { name: rotulo });

	await expect(cartao("Produtos")).toContainText(String(PRODUCTS.length));
	await expect(cartao("Famílias")).toContainText(
		String(PRODUCT_FAMILIES.length),
	);
	await expect(cartao("Receitas")).toContainText(String(RECIPES.length));

	// A quebra por família também sai do banco, não de uma contagem guardada.
	for (const familia of PRODUCT_FAMILIES) {
		await expect(page.getByRole("link", { name: familia.name })).toContainText(
			String(PRODUCTS.filter((p) => p.familySlug === familia.slug).length),
		);
	}
});

test("a lista de produtos traz o catálogo inteiro", async ({ page }) => {
	await page.goto("/admin/produtos");

	await expect(
		page.getByText(`${PRODUCTS.length} produtos no catálogo.`),
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: `Editar ${PRODUCTS[0].name}` }),
	).toBeVisible();
});

test("o filtro de família vem da URL", async ({ page }) => {
	const familia = PRODUCT_FAMILIES[0];
	const daFamilia = PRODUCTS.filter((p) => p.familySlug === familia.slug);

	await page.goto(`/admin/produtos?familia=${familia.slug}`);

	// Colado no navegador, o link da visão geral tem que abrir já filtrado.
	await expect(
		page.getByText(`Família ${familia.slug} — ${daFamilia.length} produtos.`),
	).toBeVisible();
	await expect(page.getByRole("row")).toHaveCount(daFamilia.length + 1);
});

test("a lista de receitas traz todas as publicadas", async ({ page }) => {
	await page.goto("/admin/receitas");

	await expect(
		page.getByText(`${RECIPES.length} receitas no catálogo.`),
	).toBeVisible();
});

test("a edição de receita volta preenchida, e sobrevive ao recarregar", async ({
	page,
}) => {
	await page.goto(`/admin/receitas/${RECEITA.slug}`);

	const conferir = async () => {
		await expect(
			page.getByRole("heading", { name: RECEITA.name }),
		).toBeVisible();

		// Cada ingrediente no seu campo e na sua posição: é a ordem que a
		// publicação grava, então trocar duas linhas mudaria a receita no site.
		for (const [indice, ingrediente] of RECEITA.ingredients.entries()) {
			await expect(
				page.getByLabel(`Ingredientes, item ${indice + 1}`),
			).toHaveValue(ingrediente);
		}

		for (const [indice, passo] of RECEITA.steps.entries()) {
			await expect(
				page.getByLabel(`Modo de preparo, item ${indice + 1}`),
			).toHaveValue(passo);
		}

		for (const slug of RECEITA.usedProductSlugs) {
			const produto = PRODUCTS.find((p) => p.slug === slug);
			await expect(
				page.getByRole("button", { name: `Remover ${produto?.name ?? slug}` }),
			).toBeVisible();
		}
	};

	await conferir();
	await page.reload();
	await conferir();
});

test("recusa remover produto citado, com a frase do domínio", async ({
	page,
}) => {
	const slugCitado = RECEITA.usedProductSlugs[0];
	const citado = PRODUCTS.find((produto) => produto.slug === slugCitado);
	expect(
		citado,
		"a receita de referência precisa citar algum produto",
	).toBeTruthy();

	// A confirmação é um `confirm()` do navegador, que o Playwright dispensa
	// por padrão.
	page.on("dialog", (dialogo) => dialogo.accept());

	await page.goto("/admin/produtos");
	await page.getByRole("button", { name: `Remover ${citado?.name}` }).click();

	// A regra é do domínio e chega inteira à tela: sem isso o autor veria o
	// erro de chave estrangeira do Postgres, ou nada.
	await expect(
		page.getByText(`Não dá para remover "${citado?.name}"`),
	).toBeVisible();
	await expect(page.getByText(`"${RECEITA.name}"`).first()).toBeVisible();

	// E o produto continua lá.
	await page.reload();
	await expect(
		page.getByRole("button", { name: `Editar ${citado?.name}` }),
	).toBeVisible();
});
