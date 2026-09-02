// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PhotoFrame } from "@/components/ui/photo-frame";
import { ProductImage } from "@/components/ui/product-image";

afterEach(cleanup);

/**
 * As fotos são entregues fora do código: packshots vêm do pipeline e as
 * editoriais ainda não existem. O site precisa degradar para uma placa da
 * marca em vez de mostrar o ícone de imagem quebrada.
 */
describe("ProductImage", () => {
	it("renderiza o packshot enquanto o arquivo carrega", () => {
		render(<ProductImage src="/images/products/chas/x.webp" alt="Camomila" />);

		const img = screen.getByAltText("Camomila");
		expect(img.getAttribute("src")).toBe("/images/products/chas/x.webp");
	});

	it("troca pela placa da marca quando o arquivo falha", () => {
		render(<ProductImage src="/images/products/chas/x.webp" alt="Camomila" />);

		fireEvent.error(screen.getByAltText("Camomila"));

		expect(screen.queryByAltText("Camomila")).toBeNull();
		expect(screen.getByText("Camomila")).toBeTruthy();
	});

	it("carrega adiado por padrão e ansioso quando pedido", () => {
		const { rerender } = render(<ProductImage src="/a.webp" alt="A" />);
		expect(screen.getByAltText("A").getAttribute("loading")).toBe("lazy");

		rerender(<ProductImage src="/a.webp" alt="A" loading="eager" />);
		expect(screen.getByAltText("A").getAttribute("loading")).toBe("eager");
	});
});

describe("PhotoFrame", () => {
	it("mostra a dica quando não há foto", () => {
		render(<PhotoFrame alt="Frota antiga" hint="Foto de arquivo" />);

		expect(screen.getByText("Foto de arquivo")).toBeTruthy();
		expect(screen.queryByAltText("Frota antiga")).toBeNull();
	});

	it("cai para a dica quando a foto falha", () => {
		render(
			<PhotoFrame
				src="/images/historia.jpg"
				alt="Frota antiga"
				hint="Foto de arquivo"
			/>,
		);

		fireEvent.error(screen.getByAltText("Frota antiga"));

		expect(screen.getByText("Foto de arquivo")).toBeTruthy();
	});

	it("usa o alt como dica quando nenhuma é informada", () => {
		render(<PhotoFrame alt="Sem dica" />);
		expect(screen.getByText("Sem dica")).toBeTruthy();
	});
});
