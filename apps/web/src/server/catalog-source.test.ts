import { type CatalogoPublicado, CONTEUDO_PADRAO } from "@my-better-t-app/core";
import { describe, expect, it, vi } from "vitest";
import {
	CATALOG_CACHE_KEY,
	CATALOG_CACHE_TAG,
	type CatalogCache,
	createCatalogSource,
	shouldExpireCatalog,
} from "@/server/catalog-source";

const RESERVA: CatalogoPublicado = {
	families: [{ slug: "chas", name: "Chás", count: 1 }],
	products: [
		{
			slug: "boldo",
			name: "Boldo",
			familySlug: "chas",
			family: "Chás",
			image: "",
		},
	],
	recipes: [],
	content: CONTEUDO_PADRAO,
};

const DO_BANCO: CatalogoPublicado = {
	...RESERVA,
	products: [{ ...RESERVA.products[0], name: "Boldo do Chile" }],
};

/** Cache em memória com etiquetas, do tamanho do que o teste precisa. */
function cacheEmMemoria(): CatalogCache & { tamanho: () => number } {
	const entradas = new Map<string, { value: unknown; tags: string[] }>();
	return {
		get: async (key) => entradas.get(key)?.value,
		set: async (key, value, options) => {
			entradas.set(key, { value, tags: options.tags });
		},
		expireTag: async (tag) => {
			for (const [key, entrada] of entradas) {
				if (entrada.tags.includes(tag)) entradas.delete(key);
			}
		},
		tamanho: () => entradas.size,
	};
}

function montar(
	sobrescreve: Partial<Parameters<typeof createCatalogSource>[0]> = {},
) {
	const cache = cacheEmMemoria();
	const lerDoBanco = vi.fn(async () => DO_BANCO);
	const registrar = vi.fn();
	const fonte = createCatalogSource({
		temBanco: () => true,
		lerDoBanco,
		cache: () => cache,
		reserva: RESERVA,
		registrar,
		...sobrescreve,
	});
	return { fonte, cache, lerDoBanco, registrar };
}

describe("fonte do catálogo do site", () => {
	it("sem banco configurado, serve a reserva sem tentar ler", async () => {
		const { fonte, lerDoBanco, registrar } = montar({ temBanco: () => false });

		expect(await fonte.load()).toBe(RESERVA);
		expect(lerDoBanco).not.toHaveBeenCalled();
		// Site sem banco é configuração válida, não incidente.
		expect(registrar).not.toHaveBeenCalled();
	});

	it("lê do banco na primeira visita e do cache na seguinte", async () => {
		const { fonte, lerDoBanco } = montar();

		expect(await fonte.load()).toEqual(DO_BANCO);
		expect(await fonte.load()).toEqual(DO_BANCO);

		expect(lerDoBanco).toHaveBeenCalledTimes(1);
	});

	it("volta ao banco depois que o painel grava", async () => {
		const { fonte, lerDoBanco } = montar();
		await fonte.load();

		await fonte.expire();
		lerDoBanco.mockResolvedValueOnce({ ...DO_BANCO, recipes: [] });
		await fonte.load();

		expect(lerDoBanco).toHaveBeenCalledTimes(2);
	});

	it("guarda o catálogo sob a etiqueta que a gravação expira", async () => {
		const cache = cacheEmMemoria();
		const set = vi.spyOn(cache, "set");
		const { fonte } = montar({ cache: () => cache });

		await fonte.load();

		expect(set.mock.calls[0][2].tags).toEqual([CATALOG_CACHE_TAG]);
	});

	it("com o banco fora do ar, serve a reserva e registra a falha", async () => {
		const erro = new Error("ECONNREFUSED");
		const { fonte, cache, registrar } = montar({
			lerDoBanco: async () => {
				throw erro;
			},
		});

		expect(await fonte.load()).toBe(RESERVA);
		expect(registrar).toHaveBeenCalledWith(
			expect.stringContaining("reserva"),
			erro,
		);
		// A reserva não entra no cache: ela esconderia o banco quando voltasse.
		expect(cache.tamanho()).toBe(0);
	});

	it("com o banco lento, não segura a página além do limite", async () => {
		const { fonte, registrar } = montar({
			lerDoBanco: () => new Promise(() => {}),
			limiteDeLeituraMs: 20,
		});

		expect(await fonte.load()).toBe(RESERVA);
		expect(registrar).toHaveBeenCalledTimes(1);
	});

	it("depois de uma falha, dá uma pausa antes de tentar o banco de novo", async () => {
		let relogio = 0;
		const lerDoBanco = vi
			.fn<() => Promise<CatalogoPublicado>>()
			.mockRejectedValueOnce(new Error("fora do ar"))
			.mockResolvedValue(DO_BANCO);
		const { fonte } = montar({ lerDoBanco, agora: () => relogio });

		await fonte.load();
		relogio = 10_000;
		expect(await fonte.load()).toBe(RESERVA);
		expect(lerDoBanco).toHaveBeenCalledTimes(1);

		relogio = 31_000;
		expect(await fonte.load()).toEqual(DO_BANCO);
		expect(lerDoBanco).toHaveBeenCalledTimes(2);
	});

	it("uma gravação bem-sucedida encerra a pausa", async () => {
		const lerDoBanco = vi
			.fn<() => Promise<CatalogoPublicado>>()
			.mockRejectedValueOnce(new Error("fora do ar"))
			.mockResolvedValue(DO_BANCO);
		const { fonte } = montar({ lerDoBanco, agora: () => 0 });

		await fonte.load();
		await fonte.expire();

		// Quem acabou de salvar não pode ver a reserva.
		expect(await fonte.load()).toEqual(DO_BANCO);
	});

	it("cache quebrado não derruba o site: segue pelo banco", async () => {
		const quebrado: CatalogCache = {
			get: async () => {
				throw new Error("cache indisponível");
			},
			set: async () => {
				throw new Error("cache indisponível");
			},
			expireTag: async () => {
				throw new Error("cache indisponível");
			},
		};
		const { fonte, registrar } = montar({ cache: () => quebrado });

		expect(await fonte.load()).toEqual(DO_BANCO);
		await expect(fonte.expire()).resolves.toBeUndefined();
		expect(registrar).toHaveBeenCalled();
	});

	it("ignora uma entrada de cache que não tem a forma do catálogo", async () => {
		const cache = cacheEmMemoria();
		await cache.set(
			CATALOG_CACHE_KEY,
			{ qualquer: "coisa" },
			{ ttl: 1, tags: [] },
		);
		const { fonte, lerDoBanco } = montar({ cache: () => cache });

		expect(await fonte.load()).toEqual(DO_BANCO);
		expect(lerDoBanco).toHaveBeenCalledTimes(1);
	});
});

describe("quando a rota do tRPC expira o cache", () => {
	it("expira depois de uma gravação que deu certo", () => {
		expect(shouldExpireCatalog("POST", true)).toBe(true);
	});

	it("não expira quando a gravação foi recusada", () => {
		expect(shouldExpireCatalog("POST", false)).toBe(false);
	});

	it("não expira em consulta", () => {
		expect(shouldExpireCatalog("GET", true)).toBe(false);
	});
});
