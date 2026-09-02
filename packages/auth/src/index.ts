import { getDb } from "@my-better-t-app/db";
import * as schema from "@my-better-t-app/db/schema/auth";
import { env } from "@my-better-t-app/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export function createAuth() {
	const db = getDb();

	return betterAuth({
		database: drizzleAdapter(db, {
			provider: "pg",

			schema: schema,
		}),
		trustedOrigins: [env.BETTER_AUTH_URL],
		emailAndPassword: {
			enabled: true,
		},
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		advanced: {
			defaultCookieAttributes: {
				// Admin e API vivem na mesma origem do site desde a fusão com o
				// TanStack Start. "none" exigia secure:true e derrubava o login em
				// http://localhost; "lax" é o correto para mesma origem.
				sameSite: "lax",
				secure: env.NODE_ENV === "production",
				httpOnly: true,
			},
		},
		plugins: [],
	});
}

let instance: ReturnType<typeof createAuth> | undefined;

/** Instância criada sob demanda — veja a nota em `packages/db`. */
export function getAuth() {
	instance ??= createAuth();
	return instance;
}
