import { expect, test } from "@playwright/test";

/**
 * O painel sob o mesmo servidor sem `DATABASE_URL` (veja playwright.config.ts).
 *
 * A garantia aqui é dupla: a barreira de acesso vale para toda rota do admin, e
 * a casca do painel não arrasta o banco para o bundle do site — se alguém
 * importar `packages/db` de forma estática numa rota, a página nem carrega.
 */

const ROTAS_PROTEGIDAS = [
	"/admin",
	"/admin/produtos",
	"/admin/receitas",
	"/admin/receitas/nova",
	"/admin/receitas/arroz-a-grega",
];

test.describe("acesso ao painel", () => {
	for (const rota of ROTAS_PROTEGIDAS) {
		test(`${rota} pede login sem sessão`, async ({ page }) => {
			const resposta = await page.goto(rota);
			expect(resposta?.status()).toBe(200);

			await expect(
				page.getByRole("heading", { name: /Administração/ }),
			).toBeVisible();
			// A URL pretendida é preservada: o formulário ocupa o lugar do
			// conteúdo em vez de redirecionar para uma tela de login separada.
			expect(new URL(page.url()).pathname).toBe(rota);
		});
	}

	test("diz que está indisponível em vez de oferecer login que falha", async ({
		page,
	}) => {
		// A suíte roda sem banco, então a API de sessão responde erro — que é
		// exatamente o cenário de um ambiente publicado para validação.
		await page.goto("/admin");
		await expect(
			page.getByRole("heading", { name: "Administração indisponível" }),
		).toBeVisible();
	});

	test("não expõe o painel à indexação", async ({ page }) => {
		await page.goto("/admin");
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
			"content",
			"noindex, nofollow",
		);
	});

	test("não mistura o cabeçalho e o rodapé do site", async ({ page }) => {
		await page.goto("/admin");
		await expect(
			page.getByRole("navigation", { name: "Navegação principal" }),
		).toHaveCount(0);
		await expect(page.getByRole("contentinfo")).toHaveCount(0);
	});
});
