import type {
	AdminUser,
	NovoUsuario,
	UserDirectory,
} from "@my-better-t-app/core";
import { getDb } from "@my-better-t-app/db";
import {
	acharContaMaisAntiga,
	acharContaPorEmail,
	listarContas,
	removerConta,
} from "@my-better-t-app/db/repositories/users";
import { getAuth } from "./index";

/**
 * Adaptador do cadastro de usuários sobre o Better-Auth.
 *
 * Ler e remover vão direto na tabela de contas. Criar passa pelo Better-Auth,
 * que é quem sabe gerar o hash da senha e a linha de credencial. A chamada é
 * do lado do servidor, sem requisição: não passa pela rota HTTP e portanto não
 * esbarra no cadastro fechado ao público.
 */
export class BetterAuthUserDirectory implements UserDirectory {
	list(): Promise<AdminUser[]> {
		return listarContas(getDb());
	}

	findByEmail(email: string): Promise<AdminUser | null> {
		return acharContaPorEmail(getDb(), email);
	}

	findOldest(): Promise<AdminUser | null> {
		return acharContaMaisAntiga(getDb());
	}

	async create(entrada: NovoUsuario): Promise<AdminUser> {
		const resultado = await getAuth().api.signUpEmail({
			body: {
				name: entrada.name,
				email: entrada.email,
				password: entrada.password,
			},
		});

		return {
			id: resultado.user.id,
			name: resultado.user.name,
			email: resultado.user.email,
		};
	}

	delete(id: string): Promise<void> {
		return removerConta(getDb(), id);
	}
}

let instancia: BetterAuthUserDirectory | undefined;

export function getUserDirectory(): UserDirectory {
	instancia ??= new BetterAuthUserDirectory();
	return instancia;
}
