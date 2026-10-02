import type { AdminUser, NovoUsuario } from "../domain/user";
import type { UserDirectory } from "../ports/user-directory";

/**
 * Cadastro de usuários em memória, para exercitar as regras sem Better-Auth.
 *
 * Guarda a senha em claro de propósito: o que importa nos testes é qual conta
 * existe, e o adaptador real é quem responde por hash e sessão.
 */
export class InMemoryUserDirectory implements UserDirectory {
	private readonly usuarios = new Map<string, AdminUser>();
	private proximo = 1;

	constructor(iniciais: readonly AdminUser[] = []) {
		for (const usuario of iniciais) this.usuarios.set(usuario.id, usuario);
	}

	async list(): Promise<AdminUser[]> {
		return [...this.usuarios.values()];
	}

	async findByEmail(email: string): Promise<AdminUser | null> {
		return (
			[...this.usuarios.values()].find((usuario) => usuario.email === email) ??
			null
		);
	}

	async create(entrada: NovoUsuario): Promise<AdminUser> {
		const usuario = {
			id: `usuario-${this.proximo++}`,
			name: entrada.name,
			email: entrada.email,
		};
		this.usuarios.set(usuario.id, usuario);
		return usuario;
	}

	async delete(id: string): Promise<void> {
		this.usuarios.delete(id);
	}
}
