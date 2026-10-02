import { formatarDuracao, type Recipe } from "../domain/recipe";
import type { SiteContent } from "../domain/site-content";
import type { CatalogRepositories } from "../ports/catalog-repository";
import { listarFamiliasComContagem, listarProdutos } from "./products";
import { listarReceitas } from "./recipes";
import { obterConteudoDoSite } from "./site-content";

/**
 * O catálogo na forma em que o site o exibe.
 *
 * É a mesma forma dos arquivos de `apps/web/src/data/`, que servem de reserva
 * quando o banco não responde: o site consome um formato só, venha ele do
 * Postgres ou do retrato publicado.
 *
 * Difere das entidades em três pontos, todos de exibição: a família carrega a
 * contagem de produtos, o produto carrega o nome da família, e a foto ausente
 * é texto vazio em vez de `null` — o componente de imagem trata os dois
 * iguais, e o vazio atravessa a serialização sem caso especial.
 */

export interface FamiliaPublicada {
	readonly slug: string;
	readonly name: string;
	readonly count: number;
}

export interface ProdutoPublicado {
	readonly slug: string;
	readonly name: string;
	readonly familySlug: string;
	readonly family: string;
	readonly image: string;
}

export interface ReceitaPublicada {
	readonly slug: string;
	readonly name: string;
	/** "1 h 20 min". Derivado de `minutes`, nunca guardado. */
	readonly time: string;
	readonly minutes: number;
	readonly level: Recipe["level"];
	readonly servings: number;
	readonly category: Recipe["category"];
	readonly summary: string;
	readonly image: string;
	readonly ingredients: readonly string[];
	readonly steps: readonly string[];
	readonly usedProductSlugs: readonly string[];
}

export interface CatalogoPublicado {
	readonly families: readonly FamiliaPublicada[];
	readonly products: readonly ProdutoPublicado[];
	readonly recipes: readonly ReceitaPublicada[];
	/** Configurações e textos das páginas, já resolvidos contra o padrão. */
	readonly content: SiteContent;
}

export async function montarCatalogoPublicado(
	repos: CatalogRepositories,
): Promise<CatalogoPublicado> {
	const [familias, produtos, receitas, content] = await Promise.all([
		listarFamiliasComContagem(repos.products),
		listarProdutos(repos.products),
		listarReceitas(repos.recipes),
		obterConteudoDoSite(repos.content),
	]);

	const nomeDaFamilia = new Map(familias.map((f) => [f.slug, f.name]));

	return {
		families: familias.map((familia) => ({
			slug: familia.slug,
			name: familia.name,
			count: familia.count,
		})),
		products: produtos.map((produto) => ({
			slug: produto.slug,
			name: produto.name,
			familySlug: produto.familySlug,
			family: nomeDaFamilia.get(produto.familySlug) ?? "",
			image: produto.image ?? "",
		})),
		// Ordem por slug, comparando caractere a caractere. O `ORDER BY` do
		// Postgres e o `localeCompare` dependem do idioma configurado — um põe
		// "macarrao-a-primavera" antes de "macarrao-ao-molho", outro depois —, e
		// a home mostra as três primeiras: elas não podem mudar de máquina para
		// máquina.
		recipes: [...receitas]
			.sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0))
			.map((receita) => ({
				slug: receita.slug,
				name: receita.name,
				time: formatarDuracao(receita.minutes),
				minutes: receita.minutes,
				level: receita.level,
				servings: receita.servings,
				category: receita.category,
				summary: receita.summary,
				image: receita.image ?? "",
				ingredients: receita.ingredients,
				steps: receita.steps,
				usedProductSlugs: receita.usedProductSlugs,
			})),
		content,
	};
}
