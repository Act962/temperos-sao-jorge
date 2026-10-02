import { InvalidInputError } from "./errors";

/** Quem tem acesso ao painel. Todo usuário é administrador. */
export interface AdminUser {
	readonly id: string;
	readonly name: string;
	readonly email: string;
}

export interface NovoUsuario {
	name: string;
	email: string;
	password: string;
}

export const TAMANHO_MINIMO_DA_SENHA = 8;

/** Confere e apara os dados de um usuário novo. A senha não é aparada. */
export function validarNovoUsuario(entrada: NovoUsuario): NovoUsuario {
	const name = entrada.name.trim();
	if (name === "") throw new InvalidInputError("Informe o nome do usuário.");

	const email = entrada.email.trim().toLowerCase();
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		throw new InvalidInputError(`E-mail inválido: "${entrada.email.trim()}".`);
	}

	if (entrada.password.length < TAMANHO_MINIMO_DA_SENHA) {
		throw new InvalidInputError(
			`A senha precisa de pelo menos ${TAMANHO_MINIMO_DA_SENHA} caracteres.`,
		);
	}

	return { name, email, password: entrada.password };
}
