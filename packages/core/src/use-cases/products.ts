import {
	ConflictError,
	InvalidInputError,
	NotFoundError,
} from "../domain/errors";
import {
	criarFamilia,
	criarProduto,
	type NovoProduto,
	type Product,
	type ProductFamily,
} from "../domain/product";
import { comoSlug, paraSlug, type Slug } from "../domain/slug";
import type {
	CatalogRepositories,
	ProductRepository,
} from "../ports/catalog-repository";

/**
 * Casos de uso do catálogo de produtos.
 *
 * Cada um recebe o repositório por parâmetro em vez de importar uma instância.
 * Não é cerimônia: é o que deixa o mesmo código rodar contra Postgres no admin
 * e contra memória no teste, sem mock de módulo.
 */

export async function listarFamilias(
	repo: ProductRepository,
): Promise<ProductFamily[]> {
	const familias = await repo.listFamilies();
	return familias.sort((a, b) => a.position - b.position);
}

export async function listarProdutos(
	repo: ProductRepository,
): Promise<Product[]> {
	const produtos = await repo.list();
	return produtos.sort((a, b) => a.position - b.position);
}

export async function listarProdutosDaFamilia(
	repo: ProductRepository,
	familySlug: string,
): Promise<Product[]> {
	const slug = comoSlug(familySlug);

	if (!(await repo.findFamily(slug))) {
		throw new NotFoundError("Família", familySlug);
	}

	const produtos = await repo.listByFamily(slug);
	return produtos.sort((a, b) => a.position - b.position);
}

export async function obterProduto(
	repo: ProductRepository,
	slug: string,
): Promise<Product> {
	const produto = await repo.find(comoSlug(slug));
	if (!produto) throw new NotFoundError("Produto", slug);
	return produto;
}

/** Um a mais que a maior posição: quem chega por último entra no fim. */
function proximaPosicao(itens: readonly { position: number }[]): number {
	return itens.reduce((maior, item) => Math.max(maior, item.position), -1) + 1;
}

/**
 * Cria um produto.
 *
 * Slug e posição são opcionais porque quem cadastra pelo painel não tem como
 * saber nenhum dos dois: o slug sai do nome, e o produto entra no fim da
 * lista. Com a posição padrão 0 ele aparecia antes de todo o catálogo.
 */
export async function criarNovoProduto(
	repo: ProductRepository,
	entrada: Omit<NovoProduto, "slug"> & { slug?: string },
): Promise<Product> {
	const produto = criarProduto({
		...entrada,
		slug: entrada.slug ?? paraSlug(entrada.name),
		position: entrada.position ?? proximaPosicao(await repo.list()),
	});

	if (await repo.find(produto.slug)) {
		throw new ConflictError(
			`Já existe um produto com o slug "${produto.slug}".`,
		);
	}

	// A família precisa existir: sem isso o produto some das listagens, porque
	// toda navegação do site parte da família.
	if (!(await repo.findFamily(produto.familySlug))) {
		throw new NotFoundError("Família", produto.familySlug);
	}

	await repo.save(produto);
	return produto;
}

export async function atualizarProduto(
	repo: ProductRepository,
	slug: string,
	alteracoes: Partial<Omit<NovoProduto, "slug">>,
): Promise<Product> {
	const atual = await obterProduto(repo, slug);
	const familySlug = alteracoes.familySlug ?? atual.familySlug;

	// A existência da família é conferida antes de montar a entidade. Na ordem
	// inversa, mudar para uma família inexistente reclamava da pasta do
	// packshot — sintoma, não causa, e sem pista do erro de verdade.
	if (familySlug !== atual.familySlug) {
		if (!(await repo.findFamily(comoSlug(familySlug)))) {
			throw new NotFoundError("Família", familySlug);
		}
	}

	const atualizado = criarProduto({
		slug: atual.slug,
		name: alteracoes.name ?? atual.name,
		familySlug,
		image: alteracoes.image === undefined ? atual.image : alteracoes.image,
		position: alteracoes.position ?? atual.position,
	});

	await repo.save(atualizado);
	return atualizado;
}

/**
 * Remove um produto, desde que nenhuma receita o cite.
 *
 * O banco já barra pela chave estrangeira, mas o erro que ele devolve é
 * ilegível e a regra sumiria dos testes em memória, que rodam sem Postgres.
 * Aqui a recusa nomeia as receitas, que é o que o autor precisa saber para
 * decidir o que fazer.
 */
export async function removerProduto(
	repos: CatalogRepositories,
	slug: string,
): Promise<void> {
	const produto = await obterProduto(repos.products, slug);

	const receitas = await repos.recipes.listByProduct(produto.slug);
	if (receitas.length > 0) {
		const nomes = receitas.map((receita) => `"${receita.name}"`).join(", ");
		throw new ConflictError(
			`Não dá para remover "${produto.name}": ${nomes} ${receitas.length === 1 ? "cita" : "citam"} este produto.`,
		);
	}

	await repos.products.delete(produto.slug);
}

export async function criarNovaFamilia(
	repo: ProductRepository,
	entrada: { slug?: string; name: string; position?: number },
): Promise<ProductFamily> {
	const familia = criarFamilia({
		...entrada,
		slug: entrada.slug ?? paraSlug(entrada.name),
		position: entrada.position ?? proximaPosicao(await repo.listFamilies()),
	});

	if (await repo.findFamily(familia.slug)) {
		throw new ConflictError(
			`Já existe uma família com o slug "${familia.slug}".`,
		);
	}

	await repo.saveFamily(familia);
	return familia;
}

export async function obterFamilia(
	repo: ProductRepository,
	slug: string,
): Promise<ProductFamily> {
	const familia = await repo.findFamily(comoSlug(slug));
	if (!familia) throw new NotFoundError("Família", slug);
	return familia;
}

/**
 * Renomeia uma família.
 *
 * Só o nome muda. O slug é a URL `/produtos/<familia>` e a pasta dos
 * packshots: trocá-lo quebraria os links publicados e a foto de cada produto.
 */
export async function renomearFamilia(
	repo: ProductRepository,
	slug: string,
	name: string,
): Promise<ProductFamily> {
	const atual = await obterFamilia(repo, slug);
	const renomeada = criarFamilia({ ...atual, name });
	await repo.saveFamily(renomeada);
	return renomeada;
}

/**
 * Remove uma família vazia.
 *
 * O banco já recusa pela chave estrangeira, mas com um erro ilegível — e a
 * regra sumiria dos testes em memória. Aqui a recusa diz quantos produtos
 * ainda precisam de outro destino.
 */
export async function removerFamilia(
	repo: ProductRepository,
	slug: string,
): Promise<void> {
	const familia = await obterFamilia(repo, slug);

	const produtos = await repo.listByFamily(familia.slug);
	if (produtos.length > 0) {
		throw new ConflictError(
			produtos.length === 1
				? `Não dá para remover "${familia.name}": 1 produto ainda está nesta família.`
				: `Não dá para remover "${familia.name}": ${produtos.length} produtos ainda estão nesta família.`,
		);
	}

	await repo.deleteFamily(familia.slug);
}

/**
 * Regrava a ordem das famílias.
 *
 * Recebe a lista inteira, na ordem desejada. Uma lista parcial deixaria
 * posições repetidas, e a ordem no site passaria a depender do banco.
 */
export async function reordenarFamilias(
	repo: ProductRepository,
	ordem: readonly string[],
): Promise<ProductFamily[]> {
	const familias = await repo.listFamilies();
	const porSlug = new Map<string, ProductFamily>(
		familias.map((familia) => [familia.slug, familia]),
	);

	const reordenadas = ordem.flatMap((slug, position) => {
		const familia = porSlug.get(slug);
		return familia ? [{ ...familia, position }] : [];
	});

	const confere =
		reordenadas.length === familias.length &&
		ordem.length === familias.length &&
		new Set(ordem).size === ordem.length;

	if (!confere) {
		throw new InvalidInputError(
			"A nova ordem precisa conter todas as famílias, uma vez cada.",
		);
	}

	for (const familia of reordenadas) await repo.saveFamily(familia);
	return reordenadas;
}

export interface FamiliaComContagem extends ProductFamily {
	readonly count: number;
}

/**
 * Famílias com a contagem de produtos.
 *
 * O site exibe esse número no cartão da home e no menu suspenso. Derivar aqui
 * evita o campo `count` desincronizado que já existiu nos dados fixos.
 */
export async function listarFamiliasComContagem(
	repo: ProductRepository,
): Promise<FamiliaComContagem[]> {
	const [familias, produtos] = await Promise.all([
		listarFamilias(repo),
		repo.list(),
	]);

	const porFamilia = new Map<Slug, number>();
	for (const produto of produtos) {
		porFamilia.set(
			produto.familySlug,
			(porFamilia.get(produto.familySlug) ?? 0) + 1,
		);
	}

	return familias.map((familia) => ({
		...familia,
		count: porFamilia.get(familia.slug) ?? 0,
	}));
}
