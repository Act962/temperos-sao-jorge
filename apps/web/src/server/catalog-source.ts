import type { CatalogoPublicado } from "@my-better-t-app/core";

/**
 * De onde o site tira o catálogo: cache, banco ou reserva — nesta ordem.
 *
 * As dependências entram por parâmetro para a regra ser testável sem Postgres
 * nem Vercel: o que importa aqui é a ordem das tentativas e o que acontece
 * quando cada uma falha. A ligação com o mundo real está em
 * `catalog.server.ts`.
 */

// A versão sobe quando a forma do catálogo muda: uma entrada antiga no cache
// não pode ser servida como se tivesse os campos novos.
export const CATALOG_CACHE_KEY = "catalogo:v2";
export const CATALOG_CACHE_TAG = "catalogo";

/**
 * Rede de proteção, não o mecanismo: quem atualiza o cache é a expiração da
 * etiqueta quando o painel grava. O prazo só existe para o caso de uma
 * expiração se perder no caminho.
 */
const VALIDADE_EM_SEGUNDOS = 60 * 60;

/** Banco lento não pode segurar a página: depois disto, serve a reserva. */
const LIMITE_DE_LEITURA_MS = 4000;

/** Depois de uma falha, quanto tempo sem tentar o banco de novo. */
const PAUSA_APOS_FALHA_MS = 30_000;

export interface CatalogCache {
	get(key: string): Promise<unknown>;
	set(
		key: string,
		value: unknown,
		options: { ttl: number; tags: string[] },
	): Promise<void>;
	expireTag(tag: string): Promise<void>;
}

export interface CatalogSourceDeps {
	/** Falso quando não há `DATABASE_URL`: nem tenta, vai direto à reserva. */
	temBanco: () => boolean;
	lerDoBanco: () => Promise<CatalogoPublicado>;
	cache: () => CatalogCache;
	reserva: CatalogoPublicado;
	registrar: (mensagem: string, erro: unknown) => void;
	agora?: () => number;
	limiteDeLeituraMs?: number;
}

function ehCatalogo(valor: unknown): valor is CatalogoPublicado {
	if (typeof valor !== "object" || valor === null) return false;
	const candidato = valor as Record<string, unknown>;
	return (
		Array.isArray(candidato.families) &&
		Array.isArray(candidato.products) &&
		Array.isArray(candidato.recipes) &&
		typeof candidato.content === "object" &&
		candidato.content !== null
	);
}

function comLimite<T>(promessa: Promise<T>, ms: number): Promise<T> {
	return new Promise<T>((resolver, rejeitar) => {
		const relogio = setTimeout(
			() => rejeitar(new Error(`O banco não respondeu em ${ms} ms.`)),
			ms,
		);
		promessa.then(
			(valor) => {
				clearTimeout(relogio);
				resolver(valor);
			},
			(erro) => {
				clearTimeout(relogio);
				rejeitar(erro);
			},
		);
	});
}

/**
 * Uma resposta do tRPC pede a expiração do cache?
 *
 * Toda mutação chega por `POST`; consulta vai por `GET`. Uma gravação
 * recusada — regra do domínio, sessão vencida — não mudou nada no banco, e
 * expirar o cache só custaria uma leitura à toa.
 */
export function shouldExpireCatalog(method: string, ok: boolean): boolean {
	return method === "POST" && ok;
}

export function createCatalogSource(deps: CatalogSourceDeps) {
	const agora = deps.agora ?? Date.now;
	const limite = deps.limiteDeLeituraMs ?? LIMITE_DE_LEITURA_MS;
	let falhouEm: number | undefined;

	/**
	 * O cache é um acelerador: se ele falhar, o site segue pelo banco. Um erro
	 * aqui nunca pode virar página fora do ar.
	 */
	async function doCache(): Promise<CatalogoPublicado | undefined> {
		try {
			const valor = await deps.cache().get(CATALOG_CACHE_KEY);
			return ehCatalogo(valor) ? valor : undefined;
		} catch (erro) {
			deps.registrar("Não foi possível ler o cache do catálogo.", erro);
			return undefined;
		}
	}

	async function guardar(catalogo: CatalogoPublicado): Promise<void> {
		try {
			await deps.cache().set(CATALOG_CACHE_KEY, catalogo, {
				ttl: VALIDADE_EM_SEGUNDOS,
				tags: [CATALOG_CACHE_TAG],
			});
		} catch (erro) {
			deps.registrar("Não foi possível gravar o cache do catálogo.", erro);
		}
	}

	return {
		async load(): Promise<CatalogoPublicado> {
			if (!deps.temBanco()) return deps.reserva;

			const emCache = await doCache();
			if (emCache) return emCache;

			// Banco fora do ar: sem a pausa, cada visita esperaria o limite
			// inteiro antes de cair na reserva.
			if (falhouEm !== undefined && agora() - falhouEm < PAUSA_APOS_FALHA_MS) {
				return deps.reserva;
			}

			try {
				const catalogo = await comLimite(deps.lerDoBanco(), limite);
				falhouEm = undefined;
				await guardar(catalogo);
				return catalogo;
			} catch (erro) {
				falhouEm = agora();
				deps.registrar(
					"Catálogo servido da reserva: a leitura do banco falhou.",
					erro,
				);
				return deps.reserva;
			}
		},

		/** Chamado depois de toda escrita do painel. */
		async expire(): Promise<void> {
			// Uma gravação que deu certo é sinal de banco de pé: não faz sentido
			// continuar na pausa e mostrar a reserva a quem acabou de salvar.
			falhouEm = undefined;
			try {
				await deps.cache().expireTag(CATALOG_CACHE_TAG);
			} catch (erro) {
				deps.registrar("Não foi possível expirar o cache do catálogo.", erro);
			}
		},
	};
}
