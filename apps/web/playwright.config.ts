import { defineConfig, devices } from "@playwright/test";

const PORT = 3101;
const BASE_URL = `http://localhost:${PORT}`;

/**
 * O e2e roda contra o build de produção, não contra o dev server: `vp dev` não
 * monta o handler SSR do TanStack Start nesta combinação de versões, e é o
 * artefato de produção que a gente publica de qualquer forma.
 *
 * `DATABASE_URL` fica deliberadamente de fora. O site público não usa banco —
 * o conteúdo é publicado estaticamente — e um teste que só passa com Postugres
 * no ar deixaria essa propriedade regredir sem ninguém perceber.
 */
export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",

	use: {
		baseURL: BASE_URL,
		trace: "on-first-retry",
	},

	projects: [
		{ name: "desktop", use: { ...devices["Desktop Chrome"] } },
		{ name: "mobile", use: { ...devices["Pixel 7"] } },
	],

	webServer: {
		command: `node ../../node_modules/vite-plus/bin/vp preview --port ${PORT}`,
		url: BASE_URL,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
		env: { CI: "true" },
	},
});
