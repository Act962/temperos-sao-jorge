import {
	obterConteudoDoSite,
	REDES_SOCIAIS,
	salvarConteudo,
} from "@my-better-t-app/core";
import { z } from "zod";
import { traduzindoErros } from "../errors";
import { protectedProcedure, router } from "../index";

/**
 * Configurações e textos das páginas.
 *
 * Um procedimento de gravação por documento, cada um com o esquema da forma
 * dele. O esquema só garante que os campos existem e têm o tipo certo — o que
 * é um telefone aceitável, ou quantos compromissos a home mostra, quem decide
 * é o normalizador em `@my-better-t-app/core`.
 */

const texto = z.string();

const configuracoes = z.object({
	description: texto,
	contact: z.object({
		phone: texto,
		email: texto,
		street: texto,
		district: texto,
		city: texto,
		state: texto,
		postalCode: texto,
		openingHours: texto,
		hasVerifiedAddress: z.boolean(),
	}),
	whatsapp: z.object({ number: texto, message: texto }),
	social: z.array(z.object({ platform: z.enum(REDES_SOCIAIS), href: texto })),
	contactSubjects: z.array(texto),
});

const inicio = z.object({
	hero: z.object({ title: texto, text: texto, imageAlt: texto }),
	story: z.object({
		title: texto,
		text: texto,
		note: texto,
		imageAlt: texto,
	}),
	families: z.object({
		title: texto,
		representatives: z.record(z.string(), texto),
	}),
	recipes: z.object({ title: texto, text: texto }),
	values: z.array(z.object({ title: texto, text: texto })),
});

const sobre = z.object({
	intro: texto,
	story: z.array(texto),
	timelineTitle: texto,
	timeline: z.array(z.object({ year: texto, title: texto, text: texto })),
});

const documentoLegal = z.object({
	title: texto,
	updatedAt: texto,
	summary: texto,
	sections: z.array(
		z.object({
			heading: texto,
			paragraphs: z.array(texto),
			cards: z.array(z.object({ title: texto, text: texto })),
		}),
	),
});

export const contentRouter = router({
	/** O conteúdo inteiro: o salvo, ou o padrão onde nada foi salvo ainda. */
	obter: protectedProcedure.query(({ ctx }) =>
		traduzindoErros(() => obterConteudoDoSite(ctx.repos.content)),
	),

	salvarConfiguracoes: protectedProcedure
		.input(configuracoes)
		.mutation(({ ctx, input }) =>
			traduzindoErros(() =>
				salvarConteudo(ctx.repos.content, "settings", input),
			),
		),

	salvarInicio: protectedProcedure
		.input(inicio)
		.mutation(({ ctx, input }) =>
			traduzindoErros(() => salvarConteudo(ctx.repos.content, "home", input)),
		),

	salvarSobre: protectedProcedure
		.input(sobre)
		.mutation(({ ctx, input }) =>
			traduzindoErros(() => salvarConteudo(ctx.repos.content, "about", input)),
		),

	salvarLegal: protectedProcedure
		.input(
			z.object({
				documento: z.enum(["privacy", "cookies"]),
				dados: documentoLegal,
			}),
		)
		.mutation(({ ctx, input }) =>
			traduzindoErros(() =>
				salvarConteudo(ctx.repos.content, input.documento, input.dados),
			),
		),
});
