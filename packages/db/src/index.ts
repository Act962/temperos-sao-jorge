import { env } from "@my-better-t-app/env/server";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./schema";

export function createDb() {
	return drizzle(env.DATABASE_URL, { schema });
}

export type Database = ReturnType<typeof createDb>;

let instance: ReturnType<typeof createDb> | undefined;

/**
 * Conexão criada na primeira chamada, não na importação.
 *
 * O site público não toca no banco: o conteúdo é publicado estaticamente. Se
 * este módulo abrisse a conexão ao ser importado, bastaria o bundle do servidor
 * incluí-lo para o site inteiro passar a exigir DATABASE_URL no boot.
 */
export function getDb() {
	instance ??= createDb();
	return instance;
}
