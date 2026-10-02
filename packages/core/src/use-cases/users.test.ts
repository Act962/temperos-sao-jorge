import { beforeEach, describe, expect, it } from "vitest";
import {
	ConflictError,
	InvalidInputError,
	NotFoundError,
} from "../domain/errors";
import { InMemoryUserDirectory } from "../testing/in-memory-user-directory";
import {
	cadastroPeloSiteAberto,
	criarUsuario,
	listarUsuarios,
	removerUsuario,
} from "./users";

const ANA = { id: "ana", name: "Ana", email: "ana@alimentossaojorge.com" };
const BIA = { id: "bia", name: "Bia", email: "bia@alimentossaojorge.com" };

let diretorio: InMemoryUserDirectory;

beforeEach(() => {
	diretorio = new InMemoryUserDirectory([BIA, ANA]);
});

describe("cadastro pelo site", () => {
	it("fica aberto só enquanto não existe usuário nenhum", async () => {
		// É o que permite o primeiro acesso num banco vazio.
		expect(await cadastroPeloSiteAberto(new InMemoryUserDirectory())).toBe(
			true,
		);
		// Depois disso, quem conhecesse o endereço da API viraria administrador.
		expect(await cadastroPeloSiteAberto(diretorio)).toBe(false);
	});
});

describe("criação de usuário", () => {
	it("cria com o e-mail em minúsculas e o nome aparado", async () => {
		const usuario = await criarUsuario(diretorio, {
			name: "  Caio  ",
			email: " Caio@AlimentosSaoJorge.com ",
			password: "senha-forte",
		});

		expect(usuario).toMatchObject({
			name: "Caio",
			email: "caio@alimentossaojorge.com",
		});
		expect(await listarUsuarios(diretorio)).toHaveLength(3);
	});

	it("recusa e-mail já cadastrado, mesmo com outra caixa", async () => {
		await expect(
			criarUsuario(diretorio, {
				name: "Outra Ana",
				email: "ANA@alimentossaojorge.com",
				password: "senha-forte",
			}),
		).rejects.toThrow(ConflictError);
	});

	it("recusa senha curta, e-mail inválido e nome vazio", async () => {
		const base = {
			name: "Caio",
			email: "caio@alimentossaojorge.com",
			password: "senha-forte",
		};

		await expect(
			criarUsuario(diretorio, { ...base, password: "1234567" }),
		).rejects.toThrow(/pelo menos 8 caracteres/);
		await expect(
			criarUsuario(diretorio, { ...base, email: "caio" }),
		).rejects.toThrow(InvalidInputError);
		await expect(
			criarUsuario(diretorio, { ...base, name: " " }),
		).rejects.toThrow(/nome do usuário/);
	});
});

describe("listagem", () => {
	it("ordena por nome", async () => {
		const nomes = (await listarUsuarios(diretorio)).map((u) => u.name);
		expect(nomes).toEqual(["Ana", "Bia"]);
	});
});

describe("remoção de usuário", () => {
	it("remove outro usuário", async () => {
		await removerUsuario(diretorio, "bia", "ana");
		expect((await listarUsuarios(diretorio)).map((u) => u.id)).toEqual(["ana"]);
	});

	it("recusa remover a si mesmo", async () => {
		// Quem se remove fica trancado do lado de fora no meio da sessão.
		await expect(removerUsuario(diretorio, "ana", "ana")).rejects.toThrow(
			/seu próprio acesso/,
		);
	});

	it("recusa remover o último usuário", async () => {
		// Sem usuário nenhum, o cadastro pelo site reabriria para qualquer um.
		const sozinho = new InMemoryUserDirectory([ANA]);
		await expect(
			removerUsuario(sozinho, "ana", "outra-sessao"),
		).rejects.toThrow(/único usuário/);
	});

	it("falha ao remover quem não existe", async () => {
		await expect(removerUsuario(diretorio, "fantasma", "ana")).rejects.toThrow(
			NotFoundError,
		);
	});
});
