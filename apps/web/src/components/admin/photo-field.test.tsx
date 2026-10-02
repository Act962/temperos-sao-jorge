// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ValorDaFoto } from "@/components/admin/photo";
import { PhotoField } from "@/components/admin/photo-field";

/**
 * O campo de foto nos estados que a spec 0010 descreve, sem servidor: a
 * resposta de `imagens.estado` é a única coisa que ele pergunta, e é ela que
 * o teste troca.
 */
let estado = {
	ligado: true,
	base: "https://imagens.exemplo" as string | null,
	tipos: ["image/png", "image/jpeg", "image/webp"],
	tamanhoMaximo: 20 * 1024 * 1024,
};

vi.mock("@/utils/trpc", () => ({
	useTRPC: () => ({
		imagens: {
			estado: {
				queryOptions: () => ({
					queryKey: ["imagens", "estado"],
					queryFn: async () => estado,
				}),
			},
		},
	}),
}));

beforeEach(() => {
	estado = { ...estado, ligado: true };
	// O jsdom não implementa endereços de blob; o campo só precisa de um texto.
	URL.createObjectURL = vi.fn(() => "blob:previa");
	URL.revokeObjectURL = vi.fn();
});

afterEach(cleanup);

function CampoEmTeste({ inicial }: { inicial: ValorDaFoto }) {
	const [valor, setValor] = useState(inicial);
	return (
		<QueryClientProvider client={new QueryClient()}>
			<PhotoField
				rotulo="Foto do produto"
				formato="packshot"
				valor={valor}
				aoMudar={setValor}
				enviando={false}
			/>
			<output data-testid="valor">
				{JSON.stringify({ atual: valor.atual, nova: valor.nova?.name ?? null })}
			</output>
		</QueryClientProvider>
	);
}

const valor = () =>
	JSON.parse(screen.getByTestId("valor").textContent ?? "{}") as {
		atual: string;
		nova: string | null;
	};

const arquivo = (nome: string, tipo: string) =>
	new File(["conteudo"], nome, { type: tipo });

const escolher = (escolhido: File) =>
	fireEvent.change(screen.getByLabelText("Foto do produto"), {
		target: { files: [escolhido] },
	});

describe("PhotoField", () => {
	it("sem foto, convida a escolher uma", async () => {
		render(<CampoEmTeste inicial={{ atual: "", nova: null }} />);

		expect(await screen.findByText("Escolher foto")).toBeTruthy();
		expect(screen.getByText("Nenhuma foto ainda")).toBeTruthy();
		expect(screen.queryByText("Remover foto")).toBeNull();
	});

	it("mostra a foto do bucket pelo endereço público, e a antiga pelo caminho", async () => {
		const { container, unmount } = render(
			<CampoEmTeste
				inicial={{ atual: "products/chas/boldo-m3k9x2.webp", nova: null }}
			/>,
		);
		await screen.findByText("Trocar foto");
		expect(container.querySelector("img")?.getAttribute("src")).toBe(
			"https://imagens.exemplo/products/chas/boldo-m3k9x2.webp",
		);
		unmount();

		const antiga = render(
			<CampoEmTeste
				inicial={{ atual: "/images/products/chas/boldo.webp", nova: null }}
			/>,
		);
		await screen.findByText("Trocar foto");
		expect(antiga.container.querySelector("img")?.getAttribute("src")).toBe(
			"/images/products/chas/boldo.webp",
		);
	});

	it("arquivo aceito fica marcado como novo, e desfazer volta à foto salva", async () => {
		render(
			<CampoEmTeste
				inicial={{ atual: "/images/products/chas/boldo.webp", nova: null }}
			/>,
		);
		await screen.findByText("Trocar foto");

		escolher(arquivo("boldo-novo.png", "image/png"));

		expect(await screen.findByText("boldo-novo.png")).toBeTruthy();
		expect(screen.getByText("Vai ao ar quando você salvar.")).toBeTruthy();
		expect(valor()).toEqual({
			atual: "/images/products/chas/boldo.webp",
			nova: "boldo-novo.png",
		});

		fireEvent.click(screen.getByText("Desfazer"));
		expect(valor().nova).toBeNull();
		expect(screen.getByText("Foto atual")).toBeTruthy();
	});

	it("recusa na hora o que não é imagem, sem mexer na foto atual", async () => {
		render(
			<CampoEmTeste
				inicial={{ atual: "/images/products/chas/boldo.webp", nova: null }}
			/>,
		);
		await screen.findByText("Trocar foto");

		escolher(arquivo("catalogo.pdf", "application/pdf"));

		expect(screen.getByRole("alert").textContent).toContain("catalogo.pdf");
		expect(valor()).toEqual({
			atual: "/images/products/chas/boldo.webp",
			nova: null,
		});
	});

	it("remover esvazia a foto do item", async () => {
		render(
			<CampoEmTeste
				inicial={{ atual: "products/chas/boldo-m3k9x2.webp", nova: null }}
			/>,
		);

		fireEvent.click(await screen.findByText("Remover foto"));

		expect(valor()).toEqual({ atual: "", nova: null });
		expect(screen.getByText("Nenhuma foto ainda")).toBeTruthy();
	});

	it("sem bucket configurado, explica e não oferece envio", async () => {
		estado = { ...estado, ligado: false, base: null };
		render(<CampoEmTeste inicial={{ atual: "", nova: null }} />);

		await waitFor(() =>
			expect(
				screen.getByText(/ainda não foi configurado neste ambiente/),
			).toBeTruthy(),
		);
		expect(screen.queryByText("Escolher foto")).toBeNull();
		expect(
			(screen.getByLabelText("Foto do produto") as HTMLInputElement).disabled,
		).toBe(true);
	});
});
