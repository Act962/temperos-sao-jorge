#!/usr/bin/env node

/**
 * Empacota o build para a Vercel.
 *
 * Esta versão do TanStack Start não tem alvo de Vercel: `vp build` gera
 * `dist/client` (estático) e `dist/server/server.js`, que exporta um handler
 * `fetch` da Web. A Vercel, sozinha, não sabe o que fazer com isso — foi o que
 * devolveu 404 no primeiro deploy.
 *
 * A saída aqui é a Build Output API v3, que é o contrato mais explícito que a
 * Vercel oferece: em vez de torcer para o detector de framework acertar, a
 * gente descreve o que é estático, o que é função e como rotear.
 *
 *   .vercel/output/
 *   ├── config.json              rotas
 *   ├── static/                  dist/client, servido direto do CDN
 *   └── functions/index.func/    dist/server + adaptador Node
 *
 * Uso: node scripts/build-vercel.mjs   (depois de `vp build` em apps/web)
 */

import {
	cp,
	lstat,
	mkdir,
	readlink,
	rm,
	stat,
	symlink,
	writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { nodeFileTrace } from "@vercel/nft";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(RAIZ, "apps/web/dist");
/**
 * A saída fica ao lado de quem chamou, não na raiz do repositório.
 *
 * A Vercel procura `.vercel/output` dentro do Root Directory do projeto, que
 * neste caso é `apps/web`. Fixar a raiz aqui fazia o pacote ser gerado num
 * lugar onde ela nunca ia olhar.
 */
const SAIDA = path.join(process.cwd(), ".vercel/output");
const FUNCAO = path.join(SAIDA, "functions/index.func");

/**
 * Adaptador do handler `fetch` para o runtime Node da Vercel.
 *
 * Dois detalhes que quebram silenciosamente se passarem batido:
 *
 * - `set-cookie` precisa sair como vários cabeçalhos. Iterar `headers` junta
 *   os valores numa string separada por vírgula, e o navegador guarda um
 *   cookie só e malformado — o login do painel simplesmente não fecharia.
 * - O corpo é repassado como stream. Coletar tudo em memória antes de
 *   responder mataria o streaming do SSR.
 */
const ADAPTADOR = `import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import servidor from "./apps/web/dist/server/server.js";

export default async function handler(req, res) {
	const protocolo = req.headers["x-forwarded-proto"] ?? "https";
	const host = req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost";
	const url = new URL(req.url ?? "/", \`\${protocolo}://\${host}\`);

	const cabecalhos = new Headers();
	for (const [nome, valor] of Object.entries(req.headers)) {
		if (Array.isArray(valor)) {
			for (const um of valor) cabecalhos.append(nome, um);
		} else if (valor !== undefined) {
			cabecalhos.set(nome, valor);
		}
	}

	const temCorpo = req.method !== "GET" && req.method !== "HEAD";
	const requisicao = new Request(url, {
		method: req.method,
		headers: cabecalhos,
		...(temCorpo ? { body: Readable.toWeb(req), duplex: "half" } : {}),
	});

	const resposta = await servidor.fetch(requisicao);

	const cookies = resposta.headers.getSetCookie?.() ?? [];
	for (const [nome, valor] of resposta.headers) {
		if (nome.toLowerCase() === "set-cookie") continue;
		res.setHeader(nome, valor);
	}
	if (cookies.length > 0) res.setHeader("set-cookie", cookies);

	res.writeHead(resposta.status);

	if (resposta.body) {
		await pipeline(Readable.fromWeb(resposta.body), res);
	} else {
		res.end();
	}
}
`;

const CONFIG_DA_FUNCAO = {
	runtime: "nodejs22.x",
	handler: "index.mjs",
	launcherType: "Nodejs",
	// O launcher da Vercel injeta helpers de body-parsing que atrapalhariam: o
	// adaptador quer o stream cru.
	shouldAddHelpers: false,
	supportsResponseStreaming: true,
};

const ROTAS = {
	version: 3,
	routes: [
		{
			// Os nomes dos arquivos em assets/ carregam hash, então cachear para
			// sempre é seguro e tira uma ida ao servidor de cada visita.
			src: "/assets/(.*)",
			headers: { "cache-control": "public, max-age=31536000, immutable" },
			continue: true,
		},
		{
			src: "/images/(.*)",
			headers: { "cache-control": "public, max-age=604800" },
			continue: true,
		},
		// Estático primeiro; o que sobrar é SSR.
		{ handle: "filesystem" },
		{ src: "/(.*)", dest: "/index" },
	],
};

/**
 * Recria um link no destino apontando para o mesmo lugar.
 *
 * No Windows, link simbólico para diretório exige privilégio; junção não, mas
 * só aceita caminho absoluto. Como o empacotamento de verdade roda no Linux da
 * Vercel, o caminho absoluto local só atrapalharia a conferência aqui — e é
 * exatamente onde ele é usado.
 */
async function recriarLink(origem, destino) {
	const alvo = await readlink(origem);

	try {
		if (process.platform === "win32") {
			await symlink(
				path.resolve(path.dirname(origem), alvo),
				destino,
				"junction",
			);
		} else {
			await symlink(alvo, destino);
		}
	} catch (erro) {
		if (erro.code === "EEXIST") return;
		throw erro;
	}
}

async function existe(caminho) {
	try {
		await stat(caminho);
		return true;
	} catch {
		return false;
	}
}

async function main() {
	if (!(await existe(path.join(DIST, "server/server.js")))) {
		console.error(
			"apps/web/dist não está pronto. Rode o build do site antes:\n  pnpm run build",
		);
		process.exit(1);
	}

	await rm(SAIDA, { recursive: true, force: true });
	await mkdir(FUNCAO, { recursive: true });

	await cp(path.join(DIST, "client"), path.join(SAIDA, "static"), {
		recursive: true,
	});

	// O bundle do servidor não embute as dependências: importa `react` e
	// companhia de fora. Rodando de `apps/web` isso resolve pelo node_modules
	// vizinho; dentro da função não existe vizinho nenhum — foi assim que o
	// primeiro empacotamento morreu com ERR_MODULE_NOT_FOUND.
	//
	// O rastreio segue os imports e copia só o que é alcançável, preservando os
	// caminhos relativos à raiz. É o mesmo que o construtor Node da Vercel faz,
	// e resolve os symlinks do pnpm de quebra.
	const entrada = path.join(DIST, "server/server.js");
	const { fileList } = await nodeFileTrace([entrada], { base: RAIZ });

	for (const arquivo of fileList) {
		const origem = path.join(RAIZ, arquivo);
		const destino = path.join(FUNCAO, arquivo);
		const info = await lstat(origem);

		await mkdir(path.dirname(destino), { recursive: true });

		// O pnpm liga `node_modules/<pacote>` ao conteúdo real em `.pnpm`, e o
		// rastreio lista o link junto com os arquivos que estão do outro lado.
		// O link é recriado como link: materializá-lo copiaria o pacote inteiro
		// com as dependências de desenvolvimento penduradas — foi assim que a
		// função passou de 12 MB para 183, arrastando `typescript` e `sharp`
		// que nada têm a ver com servir o site.
		if (info.isSymbolicLink()) {
			await recriarLink(origem, destino);
			continue;
		}

		await cp(origem, destino, { dereference: true });
	}

	// Os assets do servidor entram inteiros: são carregados por caminho montado
	// em runtime, que o rastreio estático não enxerga.
	await cp(
		path.join(DIST, "server"),
		path.join(FUNCAO, "apps/web/dist/server"),
		{
			recursive: true,
		},
	);

	await writeFile(path.join(FUNCAO, "index.mjs"), ADAPTADOR, "utf8");
	// O adaptador é .mjs; o bundle herda o `type: module` de apps/web/package.json,
	// que o rastreio copia junto.
	await writeFile(
		path.join(FUNCAO, "package.json"),
		`${JSON.stringify({ type: "module" }, null, "\t")}\n`,
		"utf8",
	);
	await writeFile(
		path.join(FUNCAO, ".vc-config.json"),
		`${JSON.stringify(CONFIG_DA_FUNCAO, null, "\t")}\n`,
		"utf8",
	);
	await writeFile(
		path.join(SAIDA, "config.json"),
		`${JSON.stringify(ROTAS, null, "\t")}\n`,
		"utf8",
	);

	console.log(`.vercel/output pronto — ${fileList.size} arquivos rastreados`);
	console.log("  static/            <- dist/client");
	console.log("  functions/index.func/  <- dist/server + adaptador");
}

await main();
