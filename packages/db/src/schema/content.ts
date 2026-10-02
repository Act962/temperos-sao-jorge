import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Conteúdo editável do site: um documento JSON por tela do painel.
 *
 * Tabela de chave e valor de propósito. Telefone, linha do tempo e seções das
 * políticas nunca são consultados por campo — sempre lidos e gravados
 * inteiros —, então colunas e tabelas auxiliares só multiplicariam migração.
 * Quem conhece a forma de cada documento é `packages/core`.
 */
export const siteContent = pgTable("site_content", {
	key: text("key").primaryKey(),
	data: jsonb("data").notNull(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
