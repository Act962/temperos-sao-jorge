import { execFileSync } from "node:child_process";
import { expect, test as setup } from "@playwright/test";

/**
 * Preparo da suíte com banco: catálogo carregado e sessão aberta.
 *
 * Em série de propósito — a sessão não existe antes do usuário, e o catálogo
 * precisa estar no lugar antes de qualquer tela pedir dado.
 *
 * O schema já tem que estar aplicado (`pnpm run db:push`), como nos testes de
 * integração do Drizzle. Aplicar schema é tarefa de migração, não de teste.
 */
setup.describe.configure({ mode: "serial" });

const CREDENCIAIS = {
	name: "Automação",
	email: "e2e@alimentossaojorge.com",
	password: "senha-de-teste-do-e2e",
};

const SESSAO = "e2e/.auth/painel.json";

setup("carrega o catálogo no banco", () => {
	// O mesmo script da carga inicial: o que o painel mostra é o que a
	// publicação grava, e é essa igualdade que os testes conferem.
	execFileSync("node", ["../../packages/db/scripts/seed-catalog.mjs"], {
		stdio: "inherit",
	});
});

setup("abre uma sessão no painel", async ({ request }) => {
	const cadastro = await request.post("/api/auth/sign-up/email", {
		data: CREDENCIAIS,
		failOnStatusCode: false,
	});

	// Numa segunda rodada o usuário já existe: aí é só entrar.
	if (!cadastro.ok()) {
		const entrada = await request.post("/api/auth/sign-in/email", {
			data: { email: CREDENCIAIS.email, password: CREDENCIAIS.password },
			failOnStatusCode: false,
		});
		expect(
			entrada.ok(),
			`Não foi possível entrar no painel: ${await entrada.text()}`,
		).toBeTruthy();
	}

	await request.storageState({ path: SESSAO });
});
