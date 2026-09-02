import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

/**
 * As variáveis de servidor (DATABASE_URL, BETTER_AUTH_*) ficam no `.env` da
 * raiz. Antes viviam em `apps/server/.env`, que deixou de existir quando o
 * backend Hono foi absorvido pelo TanStack Start.
 */
dotenv.config({ path: "../../.env" });

export default defineConfig({
	schema: "./src/schema",
	out: "./src/migrations",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL || "",
	},
});
