import { inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import * as schema from "../schema";
import { user } from "../schema/auth";
import { acharContaMaisAntiga, removerConta } from "./users";

/**
 * A conta mais antiga, contra Postgres de verdade.
 *
 * É ela que decide qual de dois cadastros simultâneos fica (spec 0009), então
 * a ordem tem que ser a mesma para qualquer requisição que pergunte —
 * inclusive quando as duas contas nascem no mesmo instante.
 *
 * As contas do teste têm data no ano 2000 para serem as mais antigas do banco
 * sem apagar as que já existem. Sem `DATABASE_URL`, a suíte é pulada.
 */
const url = process.env.DATABASE_URL;

describe.skipIf(!url)("conta mais antiga no Drizzle", () => {
	const db = drizzle(url ?? "", { schema });
	const IDS = ["teste-conta-b", "teste-conta-a", "teste-conta-c"];
	const limpar = () => db.delete(user).where(inArray(user.id, IDS));

	const conta = (id: string, criadaEm: string) => ({
		id,
		name: id,
		email: `${id}@example.com`,
		createdAt: new Date(criadaEm),
	});

	beforeEach(limpar);
	afterAll(limpar);

	it("devolve a de data mais antiga, não a inserida primeiro", async () => {
		await db
			.insert(user)
			.values([
				conta("teste-conta-b", "2000-01-02T00:00:00Z"),
				conta("teste-conta-a", "2000-01-01T00:00:00Z"),
			]);

		expect((await acharContaMaisAntiga(db))?.id).toBe("teste-conta-a");
	});

	it("no mesmo instante, desempata pelo id", async () => {
		const instante = "2000-01-01T00:00:00Z";
		await db
			.insert(user)
			.values([
				conta("teste-conta-c", instante),
				conta("teste-conta-b", instante),
			]);

		expect((await acharContaMaisAntiga(db))?.id).toBe("teste-conta-b");
	});

	it("depois de desfeita, a conta perdedora deixa de existir", async () => {
		await db
			.insert(user)
			.values([
				conta("teste-conta-a", "2000-01-01T00:00:00Z"),
				conta("teste-conta-b", "2000-01-02T00:00:00Z"),
			]);

		await removerConta(db, "teste-conta-b");

		const restantes = await db
			.select({ id: user.id })
			.from(user)
			.where(inArray(user.id, IDS));
		expect(restantes).toEqual([{ id: "teste-conta-a" }]);
	});
});
