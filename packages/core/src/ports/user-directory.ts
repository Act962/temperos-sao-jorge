import type { AdminUser, NovoUsuario } from "../domain/user";

/**
 * Cadastro de quem acessa o painel.
 *
 * As contas pertencem ao Better-Auth, que cuida de senha e sessão. Esta porta
 * existe para as regras — não remover a si mesmo, não remover o último —
 * morarem no domínio e serem testadas sem banco nem biblioteca de
 * autenticação.
 */
export interface UserDirectory {
	list(): Promise<AdminUser[]>;
	findByEmail(email: string): Promise<AdminUser | null>;
	create(usuario: NovoUsuario): Promise<AdminUser>;
	/** Remove a conta e encerra as sessões dela. */
	delete(id: string): Promise<void>;
}
