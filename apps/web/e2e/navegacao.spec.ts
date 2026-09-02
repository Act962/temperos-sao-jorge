import { expect, test } from "@playwright/test";

/**
 * Comportamentos de navegação que já quebraram uma vez e valem alarme.
 */

test.describe("menu suspenso de produtos", () => {
	test.skip(({ isMobile }) => !!isMobile, "o painel é exclusivo do desktop");

	test("abre pelo teclado e lista os produtos da família", async ({ page }) => {
		await page.goto("/");
		await page.getByRole("link", { name: "Produtos", exact: true }).focus();

		const painel = page.getByRole("navigation", {
			name: "Famílias de produtos",
		});
		await expect(painel).toBeVisible();
		await expect(painel.getByRole("link")).toHaveCount(8);
	});

	test("a lista não rola — o painel cresce até caber", async ({ page }) => {
		// A rolagem interna trazia a barra nativa clara sobre o vermelho, e rolar
		// dentro de um painel de hover fecha o painel assim que o ponteiro sai.
		await page.goto("/");
		await page.getByRole("link", { name: "Produtos", exact: true }).focus();

		const lista = page
			.getByRole("navigation", { name: "Famílias de produtos" })
			.locator("xpath=following-sibling::div")
			.locator("ul");

		await expect(lista).toBeVisible();
		const rola = await lista.evaluate(
			(nó) => nó.scrollHeight > nó.clientHeight + 1,
		);
		expect(rola).toBe(false);
	});
});

test.describe("carrossel de famílias na home", () => {
	test("todas as oito famílias saem no HTML", async ({ page }) => {
		// O carrossel muda a apresentação, não o conteúdo indexável.
		await page.goto("/");
		const links = page.locator('a[href^="/produtos/"]');
		const hrefs = await links.evaluateAll((nós) =>
			nós.map((nó) => nó.getAttribute("href")),
		);
		expect(new Set(hrefs).size).toBeGreaterThanOrEqual(8);
	});

	test("a seta anterior começa desabilitada e a próxima avança", async ({
		page,
	}) => {
		await page.goto("/");
		const anterior = page.getByRole("button", { name: "Famílias anteriores" });
		const proxima = page.getByRole("button", { name: "Próximas famílias" });

		await expect(anterior).toBeDisabled();
		await expect(proxima).toBeEnabled();

		await proxima.click();
		await expect(anterior).toBeEnabled();
	});
});

test.describe("navegação móvel", () => {
	test.skip(({ isMobile }) => !isMobile, "só no viewport estreito");

	test("o menu abre, lista as famílias e tranca a rolagem do corpo", async ({
		page,
	}) => {
		await page.goto("/");
		await page.getByRole("button", { name: "Abrir menu" }).click();

		const menu = page.getByRole("navigation", {
			name: "Navegação principal (móvel)",
		});
		await expect(menu).toBeVisible();
		await expect(menu.getByRole("link", { name: "Chás" })).toBeVisible();

		expect(await page.evaluate(() => document.body.style.overflow)).toBe(
			"hidden",
		);

		await page.keyboard.press("Escape");
		await expect(
			page.getByRole("button", { name: "Abrir menu" }),
		).toBeVisible();
	});
});

test.describe("filtro de famílias", () => {
	test("navega para a família e marca o chip ativo", async ({ page }) => {
		await page.goto("/produtos");
		await page.getByRole("link", { name: "Molhos e Pastas" }).first().click();

		await expect(page).toHaveURL(/\/produtos\/molhos-e-pastas$/);
		await expect(
			page.getByRole("link", { name: "Molhos e Pastas" }).first(),
		).toHaveAttribute("aria-current", "page");
	});
});
