import { expect, test } from "@playwright/test";

/**
 * Trava as propriedades que vinham sendo conferidas à mão a cada mudança.
 *
 * O servidor sobe sem `DATABASE_URL` (veja playwright.config.ts): se alguém
 * reintroduzir um import estático de `packages/auth` ou `packages/db` numa
 * rota do site, tudo aqui quebra de uma vez — que é exatamente o alarme que
 * se quer.
 */

const ROTAS = [
	"/",
	"/produtos",
	"/produtos/chas",
	"/receitas",
	"/receitas/arroz-a-grega",
	"/sobre",
	"/contato",
	"/privacidade",
	"/cookies",
];

test.describe("site público sem banco", () => {
	for (const rota of ROTAS) {
		test(`${rota} responde 200`, async ({ page }) => {
			const resposta = await page.goto(rota);
			expect(resposta?.status()).toBe(200);
		});
	}

	test("endereço desconhecido devolve 404", async ({ page }) => {
		const resposta = await page.goto("/rota-que-nao-existe");
		expect(resposta?.status()).toBe(404);
		await expect(
			page.getByRole("heading", { name: /página não encontrada/i }),
		).toBeVisible();
	});
});

test.describe("SEO", () => {
	for (const rota of ["/", "/produtos", "/produtos/chas", "/sobre"]) {
		test(`${rota} declara exatamente um canonical`, async ({ page }) => {
			// Já saíram dois: o documento raiz emitia o seu junto com o da rota,
			// porque tags `link` não são deduplicadas por `rel`.
			await page.goto(rota);
			await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
		});
	}

	test("cada página tem um h1 só", async ({ page }) => {
		for (const rota of ["/", "/produtos", "/sobre", "/contato"]) {
			await page.goto(rota);
			await expect(page.locator("h1")).toHaveCount(1);
		}
	});

	test("home publica Organization e WebSite em JSON-LD", async ({ page }) => {
		await page.goto("/");
		const tipos = await page
			.locator('script[type="application/ld+json"]')
			.evaluateAll((nós) =>
				nós.map((nó) => JSON.parse(nó.textContent ?? "{}")["@type"]),
			);

		expect(tipos).toContain("Organization");
		expect(tipos).toContain("WebSite");
	});

	test("página de receita publica JSON-LD de Recipe", async ({ page }) => {
		await page.goto("/receitas/lasanha-a-bolonhesa");
		const receita = await page
			.locator('script[type="application/ld+json"]')
			.evaluateAll((nós) =>
				nós
					.map((nó) => JSON.parse(nó.textContent ?? "{}"))
					.find((dado) => dado["@type"] === "Recipe"),
			);

		expect(receita).toBeTruthy();
		expect(receita.totalTime).toBe("PT1H20M");
	});

	test("sitemap e robots respondem com o tipo certo", async ({ request }) => {
		const sitemap = await request.get("/sitemap.xml");
		expect(sitemap.status()).toBe(200);
		expect(sitemap.headers()["content-type"]).toContain("xml");
		expect((await sitemap.text()).match(/<loc>/g)?.length).toBe(21);

		const robots = await request.get("/robots.txt");
		expect(robots.status()).toBe(200);
		expect(await robots.text()).toContain("Sitemap:");
	});
});

test.describe("catálogo", () => {
	test("renderiza os 105 produtos no HTML do servidor", async ({ page }) => {
		// Sem depender de JavaScript: é assim que o robô de busca lê a página.
		await page.goto("/produtos");
		await expect(page.locator("article")).toHaveCount(105);
	});

	test("página de família mostra só os produtos dela", async ({ page }) => {
		await page.goto("/produtos/farinhas-naturais");
		await expect(page.locator("article")).toHaveCount(6);
		await expect(
			page.getByRole("heading", { level: 1, name: /farinhas naturais/i }),
		).toBeVisible();
	});

	test("família inexistente devolve 404", async ({ page }) => {
		const resposta = await page.goto("/produtos/familia-inventada");
		expect(resposta?.status()).toBe(404);
	});
});
