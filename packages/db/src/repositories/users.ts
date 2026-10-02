import { asc, eq } from "drizzle-orm";
import type { Database } from "../index";
import { user } from "../schema/auth";

/**
 * Consultas à tabela de contas do Better-Auth.
 *
 * Ficam aqui, e não em `packages/auth`, porque só este pacote fala Drizzle. O
 * adaptador da porta `UserDirectory` as junta com a criação de conta, que é
 * do Better-Auth — veja `packages/auth/src/user-directory.ts`.
 */

export interface Conta {
	id: string;
	name: string;
	email: string;
}

const CAMPOS = { id: user.id, name: user.name, email: user.email };

export function listarContas(db: Database): Promise<Conta[]> {
	return db.select(CAMPOS).from(user).orderBy(asc(user.name));
}

export async function acharContaPorEmail(
	db: Database,
	email: string,
): Promise<Conta | null> {
	const [linha] = await db
		.select(CAMPOS)
		.from(user)
		.where(eq(user.email, email))
		.limit(1);
	return linha ?? null;
}

/**
 * Sessões e credenciais vão junto, pela chave estrangeira em cascata: quem é
 * removido perde o acesso na hora, não quando a sessão vencer.
 */
export async function removerConta(db: Database, id: string): Promise<void> {
	await db.delete(user).where(eq(user.id, id));
}
