import { describe, expect, it, vi } from "vitest";
import { PRODUCTS } from "@/data/products";
import { RECIPES } from "@/data/recipes";
import { SITE } from "@/data/site";
import {
	breadcrumbSchema,
	jsonLdScript,
	localBusinessSchema,
	organizationSchema,
	productListSchema,
	recipeSchema,
} from "@/lib/structured-data";

describe("organizationSchema", () => {
	const org = organizationSchema();

	it("usa @id estável para as demais entidades referenciarem", () => {
		expect(org["@id"]).toBe(`${SITE.url}/#organization`);
	});

	it("lista só perfis reais em sameAs", () => {
		// Link para a raiz da plataforma não identifica ninguém e enfraquece o
		// sinal; por isso o YouTube saiu enquanto não há canal.
		const sameAs = org.sameAs as string[];
		expect(sameAs.length).toBeGreaterThan(0);
		for (const url of sameAs) {
			expect(url).toMatch(/^https:\/\/www\.(instagram|facebook)\.com\/.+/);
			expect(url).not.toMatch(/\.com\/?$/);
		}
	});
});

describe("localBusinessSchema", () => {
	it("não publica nada enquanto o endereço não for verificado", () => {
		// Guarda deliberada: os dados de contato ainda são os de exemplo do
		// design. Publicar endereço inventado como dado estruturado seria
		// afirmar ao Google um fato falso.
		expect(localBusinessSchema()).toBeUndefined();
	});

	it("publica o endereço assim que a verificação for ligada", async () => {
		vi.resetModules();
		vi.doMock("@/data/site", async () => {
			const real =
				await vi.importActual<typeof import("@/data/site")>("@/data/site");
			return {
				...real,
				CONTACT: { ...real.CONTACT, hasVerifiedAddress: true },
			};
		});

		const { localBusinessSchema: comEndereco } = await import(
			"@/lib/structured-data"
		);
		const schema = comEndereco();

		expect(schema).toBeDefined();
		expect(schema?.["@type"]).toBe("FoodEstablishment");
		expect(schema?.address).toMatchObject({ "@type": "PostalAddress" });

		vi.doUnmock("@/data/site");
		vi.resetModules();
	});
});

describe("recipeSchema", () => {
	it("converte duração para ISO 8601", () => {
		const porMinutos = (minutos: number) => {
			const receita = RECIPES.find((r) => r.minutes === minutos);
			if (!receita) throw new Error(`nenhuma receita de ${minutos} min`);
			return recipeSchema(receita);
		};

		expect(porMinutos(80).totalTime).toBe("PT1H20M");
		expect(porMinutos(30).totalTime).toBe("PT30M");
	});

	it("numera os passos e preserva os ingredientes", () => {
		const receita = RECIPES[0];
		const schema = recipeSchema(receita);
		const passos = schema.recipeInstructions as Array<{
			position: number;
			text: string;
		}>;

		expect(passos.map((p) => p.position)).toEqual(
			receita.steps.map((_, i) => i + 1),
		);
		expect(schema.recipeIngredient).toEqual([...receita.ingredients]);
	});
});

describe("breadcrumbSchema", () => {
	it("numera a partir de 1 e usa URL absoluta", () => {
		const schema = breadcrumbSchema([
			{ name: "Início", path: "/" },
			{ name: "Produtos", path: "/produtos" },
		]);
		const itens = schema.itemListElement as Array<{
			position: number;
			item: string;
		}>;

		expect(itens.map((i) => i.position)).toEqual([1, 2]);
		expect(itens[1].item).toBe(`${SITE.url}/produtos`);
	});
});

describe("productListSchema", () => {
	it("declara a contagem real", () => {
		const schema = productListSchema(PRODUCTS, "/produtos");
		expect(schema.numberOfItems).toBe(PRODUCTS.length);
	});
});

describe("jsonLdScript", () => {
	it("serializa em JSON válido no tipo certo", () => {
		const tag = jsonLdScript({ "@type": "Thing" });
		expect(tag.type).toBe("application/ld+json");
		expect(JSON.parse(tag.children)).toEqual({ "@type": "Thing" });
	});
});
