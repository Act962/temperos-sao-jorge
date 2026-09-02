import { relations } from "drizzle-orm";
import {
	index,
	integer,
	pgTable,
	primaryKey,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

/**
 * Catálogo do site.
 *
 * O slug é a chave primária: já é o identificador nas URLs e nos nomes de
 * arquivo dos packshots, e um id numérico separado só criaria uma segunda
 * verdade para manter em sincronia.
 */

export const productFamily = pgTable("product_family", {
	slug: text("slug").primaryKey(),
	name: text("name").notNull(),
	position: integer("position").notNull().default(0),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const product = pgTable(
	"product",
	{
		slug: text("slug").primaryKey(),
		name: text("name").notNull(),
		familySlug: text("family_slug")
			.notNull()
			// Apagar uma família com produtos é erro, não cascata silenciosa.
			.references(() => productFamily.slug, { onDelete: "restrict" }),
		image: text("image"),
		position: integer("position").notNull().default(0),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [index("product_family_slug_idx").on(table.familySlug)],
);

export const recipe = pgTable("recipe", {
	slug: text("slug").primaryKey(),
	name: text("name").notNull(),
	summary: text("summary").notNull().default(""),
	minutes: integer("minutes").notNull(),
	level: text("level").notNull(),
	servings: integer("servings").notNull(),
	category: text("category").notNull(),
	image: text("image"),
	// Listas ordenadas e sem consulta própria: guardar como json evita duas
	// tabelas auxiliares que nunca seriam filtradas.
	ingredients: text("ingredients").array().notNull(),
	steps: text("steps").array().notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** Produtos citados por uma receita. Tabela própria porque é navegável. */
export const recipeProduct = pgTable(
	"recipe_product",
	{
		recipeSlug: text("recipe_slug")
			.notNull()
			.references(() => recipe.slug, { onDelete: "cascade" }),
		productSlug: text("product_slug")
			.notNull()
			.references(() => product.slug, { onDelete: "restrict" }),
		position: integer("position").notNull().default(0),
	},
	(table) => [
		primaryKey({ columns: [table.recipeSlug, table.productSlug] }),
		index("recipe_product_product_idx").on(table.productSlug),
	],
);

export const productFamilyRelations = relations(productFamily, ({ many }) => ({
	products: many(product),
}));

export const productRelations = relations(product, ({ one, many }) => ({
	family: one(productFamily, {
		fields: [product.familySlug],
		references: [productFamily.slug],
	}),
	recipes: many(recipeProduct),
}));

export const recipeRelations = relations(recipe, ({ many }) => ({
	products: many(recipeProduct),
}));

export const recipeProductRelations = relations(recipeProduct, ({ one }) => ({
	recipe: one(recipe, {
		fields: [recipeProduct.recipeSlug],
		references: [recipe.slug],
	}),
	product: one(product, {
		fields: [recipeProduct.productSlug],
		references: [product.slug],
	}),
}));
