import { ConflictError, NotFoundError } from "../domain/errors";
import {
	type AdminUser,
	type NovoUsuario,
	validarNovoUsuario,
} from "../domain/user";
import type { UserDirectory } from "../ports/user-directory";

export async function listarUsuarios(
	diretorio: UserDirectory,
): Promise<AdminUser[]> {
	const usuarios = await diretorio.list();
	return usuarios.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export async function criarUsuario(
	diretorio: UserDirectory,
	entrada: NovoUsuario,
): Promise<AdminUser> {
	const usuario = validarNovoUsuario(entrada);

	if (await diretorio.findByEmail(usuario.email)) {
		throw new ConflictError(
			`Já existe um usuário com o e-mail "${usuario.email}".`,
		);
	}

	return diretorio.create(usuario);
}

/**
 * Remove o acesso de um usuário.
 *
 * Duas recusas, pelo mesmo motivo — o painel não pode ficar sem dono. Quem
 * remove a si mesmo se tranca do lado de fora no meio da sessão; e sem usuário
 * nenhum o cadastro pelo site reabre para qualquer um (veja
 * `cadastroPeloSiteAberto`).
 */
export async function removerUsuario(
	diretorio: UserDirectory,
	id: string,
	quemPede: string,
): Promise<void> {
	if (id === quemPede) {
		throw new ConflictError("Você não pode remover o seu próprio acesso.");
	}

	const usuarios = await diretorio.list();
	if (!usuarios.some((usuario) => usuario.id === id)) {
		throw new NotFoundError("Usuário", id);
	}

	if (usuarios.length <= 1) {
		throw new ConflictError(
			"Este é o único usuário do painel e não pode ser removido.",
		);
	}

	await diretorio.delete(id);
}

/**
 * O cadastro público só existe para o primeiro acesso.
 *
 * Num banco vazio, alguém precisa conseguir criar a primeira conta. Depois
 * disso, conta nova só nasce pela tela do painel, por quem já está dentro —
 * senão qualquer pessoa que conheça o endereço da API viraria administradora.
 */
export async function cadastroPeloSiteAberto(
	diretorio: UserDirectory,
): Promise<boolean> {
	return (await diretorio.list()).length === 0;
}
