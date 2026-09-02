// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { OrderedListField } from "@/components/admin/ordered-list-field";
import { ProductPicker } from "@/components/admin/product-picker";

afterEach(cleanup);

/** Envolve o campo controlado para o teste exercitar a interação de verdade. */
function ListaEmTeste({ inicial }: { inicial: string[] }) {
	const [itens, setItens] = useState(inicial);
	return (
		<OrderedListField
			rotulo="Ingredientes"
			itens={itens}
			aoMudar={setItens}
			placeholder="item"
			textoAdicionar="Adicionar ingrediente"
		/>
	);
}

function valores() {
	return screen
		.getAllByRole("textbox")
		.map((campo) => (campo as HTMLInputElement).value);
}

describe("OrderedListField", () => {
	it("preserva a ordem dos demais ao remover um item do meio", () => {
		render(<ListaEmTeste inicial={["Arroz", "Cebola", "Alho", "Sal"]} />);

		fireEvent.click(screen.getByLabelText("Remover item 2"));

		expect(valores()).toEqual(["Arroz", "Alho", "Sal"]);
	});

	it("sobe um item trocando com o anterior, sem perder nenhum", () => {
		render(<ListaEmTeste inicial={["Arroz", "Cebola", "Alho"]} />);

		fireEvent.click(screen.getByLabelText("Subir item 3"));

		expect(valores()).toEqual(["Arroz", "Alho", "Cebola"]);
	});

	it("trava o primeiro item para cima e o último para baixo", () => {
		render(<ListaEmTeste inicial={["Arroz", "Cebola"]} />);

		expect(
			(screen.getByLabelText("Subir item 1") as HTMLButtonElement).disabled,
		).toBe(true);
		expect(
			(screen.getByLabelText("Descer item 2") as HTMLButtonElement).disabled,
		).toBe(true);
	});

	it("adiciona uma linha em branco no fim", () => {
		render(<ListaEmTeste inicial={["Arroz"]} />);

		fireEvent.click(screen.getByText("Adicionar ingrediente"));

		expect(valores()).toEqual(["Arroz", ""]);
	});
});

const CATALOGO = [
	{ slug: "camomila", name: "Camomila" },
	{ slug: "capim-limao", name: "Capim Limão" },
	{ slug: "boldo", name: "Boldo" },
];

function PickerEmTeste({ inicial = [] as string[] }) {
	const [slugs, setSlugs] = useState(inicial);
	return (
		<ProductPicker
			catalogo={CATALOGO}
			selecionados={slugs}
			aoMudar={setSlugs}
		/>
	);
}

describe("ProductPicker", () => {
	it("não despeja o catálogo antes da busca", () => {
		render(<PickerEmTeste />);

		expect(screen.queryByText("Camomila")).toBeNull();
		expect(screen.getByText("Nenhum produto citado ainda.")).toBeTruthy();
	});

	it("mostra só os produtos que casam com o termo", () => {
		render(<PickerEmTeste />);

		fireEvent.change(screen.getByLabelText("Produtos citados"), {
			target: { value: "cam" },
		});

		expect(screen.getByText("Camomila")).toBeTruthy();
		expect(screen.queryByText("Boldo")).toBeNull();
	});

	it("adiciona o escolhido e some dos resultados seguintes", () => {
		render(<PickerEmTeste />);
		const busca = screen.getByLabelText("Produtos citados");

		fireEvent.change(busca, { target: { value: "camomila" } });
		fireEvent.click(screen.getByText("Camomila"));

		// Virou ficha: aparece com o botão de remover ao lado.
		expect(screen.getByLabelText("Remover Camomila")).toBeTruthy();

		fireEvent.change(busca, { target: { value: "camomila" } });
		expect(screen.getByText(/Nenhum produto com/)).toBeTruthy();
	});
});
