import { createFileRoute } from "@tanstack/react-router";

/**
 * Envio de fotos do painel (spec 0010).
 *
 * Import dinâmico pelo mesmo motivo das rotas de auth e do tRPC: o que está
 * do outro lado alcança o env do servidor, o cliente do bucket e o `sharp`.
 * Carregados no boot, o site público passaria a depender dos três para subir.
 *
 * Não expira o catálogo: guardar a foto não muda o que o site mostra. Quem
 * muda é a gravação do produto ou da receita, que vem em seguida pelo tRPC.
 */
export const Route = createFileRoute("/api/admin/fotos")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const { receberFoto } = await import(
					"@my-better-t-app/api/photo-upload"
				);
				return receberFoto(request);
			},
			DELETE: async ({ request }) => {
				const { descartarFoto } = await import(
					"@my-better-t-app/api/photo-upload"
				);
				return descartarFoto(request);
			},
		},
	},
});
