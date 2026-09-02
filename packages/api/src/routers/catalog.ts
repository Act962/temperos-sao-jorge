import {
	atualizarProduto,
	atualizarReceita,
	CATEGORIAS,
	criarNovaFamilia,
	criarNovaReceita,
	criarNovoProduto,
	listarFamiliasComContagem,
	listarProdutos,
	listarProdutosDaFamilia,
	listarReceitas,
	NIVEIS,
	obterProduto,
	obterReceita,
	removerProduto,
	removerReceita,
} from "@my-better-t-app/core";
import { z } from "zod";
import { traduzindoErros } from "../errors";
import { protectedProcedure, publicProcedure, router } from "../index";

/**
 * Catálogo para o admin.
 *
 * Cada procedimento só valida a forma da entrada e delega ao caso de uso — a
 * regra de negócio mora em `@my-better-t-app/core`, e é por isso que ela é
 * testada sem subir servidor nem banco.
 */

const slug = z
	.string()
	.min(1)
	.regex(
		/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
		"Use minúsculas, números e hífen simples.",
	);

const produtoEntrada = {
	name: z.string().min(1),
	familySlug: slug,
	image: z.string().nullable().optional(),
	position: z.number().int().optional(),
};

const receitaEntrada = {
	name: z.string().min(1),
	summary: z.string().default(""),
	minutes: z.number().int().positive(),
	level: z.enum(NIVEIS),
	servings: z.number().int().positive(),
	category: z.enum(CATEGORIAS),
	image: z.string().nullable().optional(),
	ingredients: z.array(z.string().min(1)).min(1),
	steps: z.array(z.string().min(1)).min(1),
	usedProductSlugs: z.array(slug).default([]),
};

export const catalogRouter = router({
	// Leitura liberada: alimenta a publicação estática, que não tem sessão.
	resumo: publicProcedure.query(({ ctx }) =>
		traduzindoErros(async () => {
			const [familias, produtos, receitas] = await Promise.all([
				listarFamiliasComContagem(ctx.repos.products),
				listarProdutos(ctx.repos.products),
				listarReceitas(ctx.repos.recipes),
			]);
			return {
				familias: familias.length,
				produtos: produtos.length,
				receitas: receitas.length,
				porFamilia: familias,
			};
		}),
	),

	familias: router({
		listar: protectedProcedure.query(({ ctx }) =>
			traduzindoErros(() => listarFamiliasComContagem(ctx.repos.products)),
		),

		criar: protectedProcedure
			.input(
				z.object({
					slug,
					name: z.string().min(1),
					position: z.number().int().optional(),
				}),
			)
			.mutation(({ ctx, input }) =>
				traduzindoErros(() => criarNovaFamilia(ctx.repos.products, input)),
			),
	}),

	produtos: router({
		listar: protectedProcedure
			.input(z.object({ familia: slug.optional() }).optional())
			.query(({ ctx, input }) =>
				traduzindoErros(() =>
					input?.familia
						? listarProdutosDaFamilia(ctx.repos.products, input.familia)
						: listarProdutos(ctx.repos.products),
				),
			),

		obter: protectedProcedure
			.input(z.object({ slug }))
			.query(({ ctx, input }) =>
				traduzindoErros(() => obterProduto(ctx.repos.products, input.slug)),
			),

		criar: protectedProcedure
			.input(z.object({ slug, ...produtoEntrada }))
			.mutation(({ ctx, input }) =>
				traduzindoErros(() => criarNovoProduto(ctx.repos.products, input)),
			),

		atualizar: protectedProcedure
			.input(
				z.object({
					slug,
					dados: z.object(produtoEntrada).partial(),
				}),
			)
			.mutation(({ ctx, input }) =>
				traduzindoErros(() =>
					atualizarProduto(ctx.repos.products, input.slug, input.dados),
				),
			),

		remover: protectedProcedure
			.input(z.object({ slug }))
			.mutation(({ ctx, input }) =>
				traduzindoErros(async () => {
					await removerProduto(ctx.repos.products, input.slug);
					return { slug: input.slug };
				}),
			),
	}),

	receitas: router({
		listar: protectedProcedure.query(({ ctx }) =>
			traduzindoErros(() => listarReceitas(ctx.repos.recipes)),
		),

		obter: protectedProcedure
			.input(z.object({ slug }))
			.query(({ ctx, input }) =>
				traduzindoErros(() => obterReceita(ctx.repos.recipes, input.slug)),
			),

		criar: protectedProcedure
			.input(z.object({ slug, ...receitaEntrada }))
			.mutation(({ ctx, input }) =>
				traduzindoErros(() => criarNovaReceita(ctx.repos, input)),
			),

		atualizar: protectedProcedure
			.input(
				z.object({
					slug,
					dados: z.object(receitaEntrada).partial(),
				}),
			)
			.mutation(({ ctx, input }) =>
				traduzindoErros(() =>
					atualizarReceita(ctx.repos, input.slug, input.dados),
				),
			),

		remover: protectedProcedure
			.input(z.object({ slug }))
			.mutation(({ ctx, input }) =>
				traduzindoErros(async () => {
					await removerReceita(ctx.repos.recipes, input.slug);
					return { slug: input.slug };
				}),
			),
	}),
});
