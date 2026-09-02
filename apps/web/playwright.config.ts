import { defineConfig, devices } from "@playwright/test";

const PORTA = 3101;
const PORTA_COM_BANCO = 3102;
const BASE_URL = `http://localhost:${PORTA}`;
const BASE_URL_COM_BANCO = `http://localhost:${PORTA_COM_BANCO}`;

/** Sessão do painel, gravada pelo projeto de preparo. */
const SESSAO = "e2e/.auth/painel.json";

/**
 * O e2e roda contra o build de produção, não contra o dev server: `vp dev` não
 * monta o handler SSR do TanStack Start nesta combinação de versões, e é o
 * artefato de produção que a gente publica de qualquer forma.
 *
 * São duas suítes, em dois servidores:
 *
 * - **sem banco** (porta 3101), onde vive quase tudo. O site público não usa
 *   Postgres — o conteúdo é publicado estaticamente — e um teste que só passa
 *   com banco no ar deixaria essa propriedade regredir sem ninguém perceber.
 *   As rotas do painel também entram aqui, provando a barreira de acesso.
 * - **com banco** (porta 3102), só para o que não dá para provar sem dado
 *   real: o painel carregando e gravando o catálogo.
 *
 * A segunda só entra quando há `DATABASE_URL`, mesmo critério dos testes de
 * integração do Drizzle. Sem ela, nem o CI nem a máquina de quem só mexe no
 * site precisam de Postgres.
 */
const comBanco = process.env.DATABASE_URL;

function servidor(porta: number, env: Record<string, string>) {
	return {
		command: `node ../../node_modules/vite-plus/bin/vp preview --port ${porta}`,
		url: `http://localhost:${porta}`,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
		env,
	};
}

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
		{
			name: "desktop",
			testIgnore: /com-banco/,
			use: { ...devices["Desktop Chrome"] },
		},
		{
			name: "mobile",
			testIgnore: /com-banco/,
			use: { ...devices["Pixel 7"] },
		},
		...(comBanco
			? [
					{
						name: "preparo",
						testMatch: /com-banco\/.*\.setup\.ts/,
						use: { ...devices["Desktop Chrome"], baseURL: BASE_URL_COM_BANCO },
					},
					{
						name: "com banco",
						testMatch: /com-banco\/.*\.spec\.ts/,
						dependencies: ["preparo"],
						// Um banco só para todos: quem grava atrapalharia quem conta.
						// Em série, na ordem do arquivo, as escritas ficam por último.
						fullyParallel: false,
						use: {
							...devices["Desktop Chrome"],
							baseURL: BASE_URL_COM_BANCO,
							storageState: SESSAO,
						},
					},
				]
			: []),
	],

	webServer: [
		// `DATABASE_URL` vazio em vez de ausente: o `dotenv` da aplicação não
		// sobrescreve variável já definida, então um `.env` local com banco não
		// consegue enfraquecer a suíte que existe para provar a ausência dele.
		servidor(PORTA, { CI: "true", DATABASE_URL: "" }),
		...(comBanco
			? [
					servidor(PORTA_COM_BANCO, {
						CI: "true",
						DATABASE_URL: comBanco,
						BETTER_AUTH_URL: BASE_URL_COM_BANCO,
						BETTER_AUTH_SECRET:
							process.env.BETTER_AUTH_SECRET ??
							"segredo-de-teste-apenas-para-o-e2e-local-0001",
					}),
				]
			: []),
	],
});
