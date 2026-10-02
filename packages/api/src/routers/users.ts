import {
	criarUsuario,
	listarUsuarios,
	removerUsuario,
} from "@my-better-t-app/core";
import { z } from "zod";
import { traduzindoErros } from "../errors";
import { protectedProcedure, router } from "../index";

/**
 * Quem acessa o painel.
 *
 * Criar conta só existe aqui, atrás de sessão: o cadastro pela rota pública do
 * Better-Auth fecha assim que o primeiro usuário existe (spec 0009).
 */
export const usersRouter = router({
	listar: protectedProcedure.query(({ ctx }) =>
		traduzindoErros(async () => ({
			usuarios: await listarUsuarios(ctx.usuarios),
			// A tela marca a própria conta e não oferece removê-la.
			voce: ctx.session.user.id,
		})),
	),

	criar: protectedProcedure
		.input(
			z.object({
				name: z.string(),
				email: z.string(),
				password: z.string(),
			}),
		)
		.mutation(({ ctx, input }) =>
			traduzindoErros(() => criarUsuario(ctx.usuarios, input)),
		),

	remover: protectedProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(({ ctx, input }) =>
			traduzindoErros(async () => {
				await removerUsuario(ctx.usuarios, input.id, ctx.session.user.id);
				return { id: input.id };
			}),
		),
});
