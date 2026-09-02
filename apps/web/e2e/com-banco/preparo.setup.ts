import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test as setup } from "@playwright/test";

/**
 * Preparo da suíte com banco: schema aplicado, catálogo carregado, sessão
 * aberta. Basta um Postgres vazio em `DATABASE_URL` — nenhum passo manual
 * antes.
 *
 * Em série de propósito: não há tabela antes do schema, nem sessão antes do
 * usuário.
 *
 * O banco apontado é tratado como descartável enquanto o e2e roda. O `push`
 * alinha o schema à força e a carga apaga o catálogo antes de gravar, então
 * não aponte para nada que você queira manter — mesma regra dos testes de
 * integração do Drizzle, que truncam as tabelas a cada caso.
 */
setup.describe.configure({ mode: "serial" });

const RAIZ = fileURLToPath(new URL("../../../../", import.meta.url));
const PACOTE_DB = path.join(RAIZ, "packages", "db");
const exigir = createRequire(import.meta.url);

const CREDENCIAIS = {
	name: "Automação",
	email: "e2e@alimentossaojorge.com",
	password: "senha-de-teste-do-e2e",
};

const SESSAO = "e2e/.auth/painel.json";

/** Roda um executável de dependência sem depender do `pnpm` estar no PATH. */
function rodar(script: string, argumentos: string[], cwd: string) {
	execFileSync(process.execPath, [script, ...argumentos], {
		cwd,
		stdio: "inherit",
	});
}

setup("aplica o schema", () => {
	setup.setTimeout(120_000);

	// `push` compara o schema com o banco e aplica a diferença: num Postgres
	// vazio cria tudo, inclusive as tabelas do Better-Auth; num banco já
	// alinhado, não faz nada. É o que deixa a suíte partir do zero.
	// O `bin.cjs` fica fora do `exports` do pacote, então o caminho sai do
	// ponto de entrada público — que é vizinho dele — em vez de um palpite
	// sobre onde o pnpm colocou a dependência.
	const entrada = exigir.resolve("drizzle-kit", { paths: [PACOTE_DB] });
	rodar(
		path.join(path.dirname(entrada), "bin.cjs"),
		["push", "--force"],
		PACOTE_DB,
	);
});

setup("carrega o catálogo", () => {
	setup.setTimeout(120_000);

	// O mesmo script da carga inicial: o que o painel mostra é o que a
	// publicação grava, e é essa igualdade que os testes conferem.
	rodar(path.join(PACOTE_DB, "scripts", "seed-catalog.mjs"), [], RAIZ);
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
