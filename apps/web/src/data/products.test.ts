import { describe, expect, it } from "vitest";
import {
	getFamilyBySlug,
	getProductsByFamily,
	PRODUCT_FAMILIES,
	PRODUCTS,
} from "@/data/products";

/**
 * Invariantes do catálogo.
 *
 * Este arquivo é gerado a partir dos nomes dos packshots, e cada regra abaixo
 * corresponde a um erro que já apareceu de verdade: slug duplicado entre
 * famílias, contagem fora de sincronia com a lista e caminho de imagem que não
 * bate com o que o pipeline grava.
 */
describe("catálogo de produtos", () => {
	it("mantém os 105 produtos em 8 famílias", () => {
		expect(PRODUCTS).toHaveLength(105);
		expect(PRODUCT_FAMILIES).toHaveLength(8);
	});

	it("não repete slug entre famílias diferentes", () => {
		// A busca por slug é global; slug repetido faria uma família devolver o
		// produto da outra.
		const slugs = PRODUCTS.map((product) => product.slug);
		expect(new Set(slugs).size).toBe(slugs.length);
	});

	it("aponta cada produto para uma família existente", () => {
		const known = new Set(PRODUCT_FAMILIES.map((family) => family.slug));
		const orphans = PRODUCTS.filter(
			(product) => !known.has(product.familySlug),
		);
		expect(orphans).toEqual([]);
	});

	it("mantém `count` igual ao número real de produtos da família", () => {
		for (const family of PRODUCT_FAMILIES) {
			expect(getProductsByFamily(family.slug)).toHaveLength(family.count);
		}
	});

	it("soma das famílias cobre o catálogo inteiro", () => {
		const total = PRODUCT_FAMILIES.reduce((sum, f) => sum + f.count, 0);
		expect(total).toBe(PRODUCTS.length);
	});

	it("grava a imagem no caminho que o pipeline produz", () => {
		// scripts/optimize-product-images.mjs escreve em
		// public/images/products/<familia>/<slug>.webp — se divergir, o site
		// mostra placeholder em vez de packshot.
		for (const product of PRODUCTS) {
			expect(product.image).toBe(
				`/images/products/${product.familySlug}/${product.image.split("/").pop()}`,
			);
			expect(product.image.endsWith(".webp")).toBe(true);
		}
	});

	it("não deixa nome ou slug vazio", () => {
		for (const product of PRODUCTS) {
			expect(product.name.trim()).not.toBe("");
			expect(product.slug).toMatch(/^[a-z0-9-]+$/);
		}
	});

	it("resolve família por slug e devolve undefined para slug inexistente", () => {
		expect(getFamilyBySlug("chas")?.name).toBe("Chás");
		expect(getFamilyBySlug("nao-existe")).toBeUndefined();
	});
});
