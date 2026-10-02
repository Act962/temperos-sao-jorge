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

/**
 * Confirma que a conta recém-criada pelo site é mesmo a primeira.
 *
 * `cadastroPeloSiteAberto` sozinho não basta: duas requisições chegando juntas
 * a um banco vazio passam as duas pela conferência antes de qualquer conta
 * existir, e nasceriam dois administradores. Depois de criar, cada uma
 * pergunta quem é a conta mais antiga — só uma é, e a outra desfaz a própria
 * criação.
 *
 * Conferir depois, em vez de travar antes, é de propósito: uma trava de sessão
 * do Postgres não atravessa um pool em modo transação, que é o que o banco de
 * produção usa. A ordem das contas é a mesma para as duas requisições, então
 * o resultado não depende de quem chega primeiro a esta função.
 *
 * Devolve `false` quando a conta foi desfeita.
 */
export async function confirmarPrimeiroCadastro(
	diretorio: UserDirectory,
	idCriado: string,
): Promise<boolean> {
	const primeira = await diretorio.findOldest();
	if (primeira === null || primeira.id === idCriado) return true;

	await diretorio.delete(idCriado);
	return false;
}
