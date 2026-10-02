import { describe, expect, it } from "vitest";
import {
	conferirArquivo,
	dimensoesReduzidas,
	LADOS_DE_ENVIO,
	LIMITE_DE_ENVIO,
	tipoDeEnvio,
} from "./photo";

const LIMITES = {
	tipos: ["image/png", "image/jpeg", "image/webp"],
	tamanhoMaximo: 20 * 1024 * 1024,
};

describe("conferência do arquivo escolhido", () => {
	it("aceita PNG, JPG e WebP dentro do limite", () => {
		for (const type of LIMITES.tipos) {
			expect(
				conferirArquivo({ name: "foto", type, size: 5_000_000 }, LIMITES),
			).toBeNull();
		}
	});

	it("recusa o que não é imagem aceita, dizendo o nome do arquivo", () => {
		const mensagem = conferirArquivo(
			{ name: "catalogo.pdf", type: "application/pdf", size: 1000 },
			LIMITES,
		);
		expect(mensagem).toContain("catalogo.pdf");
		expect(mensagem).toContain("PNG, JPG ou WebP");
	});

	it("recusa TIFF: o navegador não abre para reduzir", () => {
		expect(
			conferirArquivo(
				{ name: "original.tiff", type: "image/tiff", size: 1000 },
				LIMITES,
			),
		).not.toBeNull();
	});

	it("recusa arquivo acima do limite, com os dois tamanhos na mensagem", () => {
		const mensagem = conferirArquivo(
			{ name: "enorme.png", type: "image/png", size: 26.5 * 1024 * 1024 },
			LIMITES,
		);
		expect(mensagem).toContain("26,5 MB");
		expect(mensagem).toContain("20 MB");
	});
});

describe("redução antes do envio", () => {
	it("encolhe pela maior aresta, mantendo a proporção", () => {
		expect(dimensoesReduzidas(5000, 2500, 2000)).toEqual({
			largura: 2000,
			altura: 1000,
		});
		expect(dimensoesReduzidas(3000, 6000, 2000)).toEqual({
			largura: 1000,
			altura: 2000,
		});
	});

	it("não amplia foto menor que o alvo", () => {
		expect(dimensoesReduzidas(800, 600, 2000)).toEqual({
			largura: 800,
			altura: 600,
		});
	});

	it("tenta lados cada vez menores", () => {
		expect([...LADOS_DE_ENVIO]).toEqual(
			[...LADOS_DE_ENVIO].sort((a, b) => b - a),
		);
	});

	it("o limite de envio fica abaixo do teto de 4,5 MB da Vercel", () => {
		expect(LIMITE_DE_ENVIO).toBeLessThan(4.5 * 1024 * 1024);
	});

	it("só JPEG continua JPEG: PNG e WebP podem ter transparência", () => {
		expect(tipoDeEnvio("image/jpeg")).toBe("image/jpeg");
		expect(tipoDeEnvio("image/png")).toBe("image/png");
		expect(tipoDeEnvio("image/webp")).toBe("image/png");
	});
});
