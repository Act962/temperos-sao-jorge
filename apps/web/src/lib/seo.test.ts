import { describe, expect, it } from "vitest";
import { SITE } from "@/data/site";
import { absoluteUrl, buildPageSeo, canonicalUrl, pageTitle } from "@/lib/seo";

const contentOf = (
	meta: Array<Record<string, string>>,
	key: "name" | "property",
	value: string,
) => meta.find((tag) => tag[key] === value)?.content;

describe("canonicalUrl", () => {
	it("mantém a barra final só na home", () => {
		expect(canonicalUrl("/")).toBe(`${SITE.url}/`);
		expect(canonicalUrl("/produtos")).toBe(`${SITE.url}/produtos`);
	});

	it("aceita caminho sem barra inicial", () => {
		expect(canonicalUrl("produtos")).toBe(`${SITE.url}/produtos`);
	});
});

describe("absoluteUrl", () => {
	it("prefixa caminhos relativos", () => {
		expect(absoluteUrl("/images/hero.webp")).toBe(
			`${SITE.url}/images/hero.webp`,
		);
	});

	it("preserva URL que já é absoluta", () => {
		const externa = "https://exemplo.com/foto.jpg";
		expect(absoluteUrl(externa)).toBe(externa);
	});
});

describe("pageTitle", () => {
	it("usa a tagline na home e o sufixo da marca nas demais", () => {
		expect(pageTitle()).toBe(`${SITE.name} — ${SITE.tagline}`);
		expect(pageTitle("Contato")).toBe(`Contato | ${SITE.name}`);
	});
});

describe("buildPageSeo", () => {
	const seo = buildPageSeo({
		title: "Receitas",
		description: "Receitas da marca.",
		path: "/receitas",
	});

	it("emite exatamente um canonical", () => {
		// Tags `link` não são deduplicadas por `rel`: dois canonicals já saíram
		// juntos no HTML quando o documento raiz também declarava o seu.
		const canonicals = seo.links.filter((link) => link.rel === "canonical");
		expect(canonicals).toHaveLength(1);
		expect(canonicals[0].href).toBe(`${SITE.url}/receitas`);
	});

	it("mantém og:url igual ao canonical", () => {
		expect(contentOf(seo.meta, "property", "og:url")).toBe(
			seo.links.find((l) => l.rel === "canonical")?.href,
		);
	});

	it("repete a descrição nas três superfícies", () => {
		for (const [key, tag] of [
			["name", "description"],
			["property", "og:description"],
			["name", "twitter:description"],
		] as const) {
			expect(contentOf(seo.meta, key, tag)).toBe("Receitas da marca.");
		}
	});

	it("indexa por padrão e respeita noIndex", () => {
		expect(contentOf(seo.meta, "name", "robots")).toContain("index, follow");

		const privada = buildPageSeo({
			description: "x",
			path: "/x",
			noIndex: true,
		});
		expect(contentOf(privada.meta, "name", "robots")).toBe("noindex, nofollow");
	});

	it("usa imagem absoluta, com a da marca como padrão", () => {
		expect(contentOf(seo.meta, "property", "og:image")).toBe(
			`${SITE.url}${SITE.ogImage}`,
		);

		const comImagem = buildPageSeo({
			description: "x",
			path: "/x",
			image: "/images/recipes/a.jpg",
		});
		expect(contentOf(comImagem.meta, "property", "og:image")).toBe(
			`${SITE.url}/images/recipes/a.jpg`,
		);
	});

	it("não declara og:site_name nem og:locale — são do documento raiz", () => {
		// Estão no __root para não repetirem em toda rota.
		expect(contentOf(seo.meta, "property", "og:site_name")).toBeUndefined();
		expect(contentOf(seo.meta, "property", "og:locale")).toBeUndefined();
	});
});
