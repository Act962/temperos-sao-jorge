import { ConflictError, NotFoundError } from "../domain/errors";
import {
	criarFamilia,
	criarProduto,
	type NovoProduto,
	type Product,
	type ProductFamily,
} from "../domain/product";
import { comoSlug, type Slug } from "../domain/slug";
import type { ProductRepository } from "../ports/catalog-repository";

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

export async function criarNovoProduto(
	repo: ProductRepository,
	entrada: NovoProduto,
): Promise<Product> {
	const produto = criarProduto(entrada);

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

export async function removerProduto(
	repo: ProductRepository,
	slug: string,
): Promise<void> {
	await obterProduto(repo, slug);
	await repo.delete(comoSlug(slug));
}

export async function criarNovaFamilia(
	repo: ProductRepository,
	entrada: { slug: string; name: string; position?: number },
): Promise<ProductFamily> {
	const familia = criarFamilia(entrada);

	if (await repo.findFamily(familia.slug)) {
		throw new ConflictError(
			`Já existe uma família com o slug "${familia.slug}".`,
		);
	}

	await repo.saveFamily(familia);
	return familia;
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
