import {
	ConflictError,
	DomainError,
	InvalidInputError,
	NotFoundError,
} from "@my-better-t-app/core";
import { TRPCError } from "@trpc/server";

/**
 * Traduz erro de domínio em erro de transporte.
 *
 * O domínio não conhece HTTP nem tRPC — é aqui, na borda, que a regra vira
 * código de resposta. Sem isso, ou o domínio importaria `TRPCError`, ou toda
 * violação chegaria ao cliente como 500 sem mensagem.
 */
export function comoErroTrpc(erro: unknown): TRPCError {
	if (erro instanceof TRPCError) return erro;

	if (erro instanceof NotFoundError) {
		return new TRPCError({
			code: "NOT_FOUND",
			message: erro.message,
			cause: erro,
		});
	}

	if (erro instanceof ConflictError) {
		return new TRPCError({
			code: "CONFLICT",
			message: erro.message,
			cause: erro,
		});
	}

	if (erro instanceof InvalidInputError) {
		return new TRPCError({
			code: "BAD_REQUEST",
			message: erro.message,
			cause: erro,
		});
	}

	if (erro instanceof DomainError) {
		return new TRPCError({
			code: "UNPROCESSABLE_CONTENT",
			message: erro.message,
			cause: erro,
		});
	}

	return new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: erro });
}

/** Executa e converte qualquer erro de domínio na saída. */
export async function traduzindoErros<T>(fn: () => Promise<T>): Promise<T> {
	try {
		return await fn();
	} catch (erro) {
		throw comoErroTrpc(erro);
	}
}
