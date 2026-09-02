import { describe, expect, it } from "vitest";
import { SITE } from "@/data/site";
import { ehHostDeProducao, renderRobots } from "./robots";

const PRODUCAO = new URL(SITE.url).hostname;

/**
 * A regra existe para um erro que é silencioso e caro: uma URL provisória
 * indexada pelo buscador, que depois dá muito mais trabalho para tirar do que
 * teria dado para nunca deixar entrar.
 */
describe("ehHostDeProducao", () => {
	it("reconhece o domínio de produção", () => {
		expect(ehHostDeProducao(PRODUCAO)).toBe(true);
	});

	it("ignora porta e caixa", () => {
		expect(ehHostDeProducao(`${PRODUCAO.toUpperCase()}:443`)).toBe(true);
	});

	it("recusa pré-visualização e host ausente", () => {
		// Nada de `localhost` aqui: `VITE_SITE_URL` aponta para localhost em
		// desenvolvimento, então essa asserção passaria ou falharia conforme o
		// ambiente — que é justamente o tipo de teste que não prova nada.
		expect(ehHostDeProducao("temperos-sao-jorge.vercel.app")).toBe(false);
		expect(ehHostDeProducao("exemplo.com")).toBe(false);
		expect(ehHostDeProducao(null)).toBe(false);
	});

	it("não se deixa enganar por sufixo parecido", () => {
		// `alimentossaojorge.com.br.exemplo.net` não é o site.
		expect(ehHostDeProducao(`${PRODUCAO}.exemplo.net`)).toBe(false);
	});
});

describe("renderRobots", () => {
	it("libera e aponta o sitemap em produção", () => {
		const saida = renderRobots(PRODUCAO);
		expect(saida).toContain("Allow: /");
		expect(saida).toContain(`Sitemap: ${SITE.url}/sitemap.xml`);
		expect(saida).toContain("Disallow: /admin");
	});

	it("barra tudo fora de produção, sem apontar sitemap", () => {
		const saida = renderRobots("temperos-sao-jorge.vercel.app");
		expect(saida).toContain("Disallow: /");
		expect(saida).not.toContain("Allow: /");
		// Um `Sitemap:` aqui convidaria o rastreador para dentro do que a linha
		// de cima acabou de barrar.
		expect(saida).not.toContain("Sitemap:");
	});
});
