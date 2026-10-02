import { TAMANHO_MAXIMO, TIPOS_DO_PAINEL } from "@my-better-t-app/core";
import { baseDasImagens, envioDeFotosLigado } from "../images";
import { protectedProcedure, router } from "../index";

/**
 * O que o painel precisa saber sobre as fotos antes de mostrar o campo.
 *
 * O envio em si não passa por aqui — é um arquivo, e vai pela rota
 * `/api/admin/fotos`. Veja `photo-upload.ts`.
 */
export const imagesRouter = router({
	estado: protectedProcedure.query(async () => ({
		/** Falso sem as variáveis do bucket: o campo aparece desativado. */
		ligado: await envioDeFotosLigado(),
		/** Para o painel montar o endereço de uma foto guardada por chave. */
		base: baseDasImagens(),
		tipos: TIPOS_DO_PAINEL,
		tamanhoMaximo: TAMANHO_MAXIMO,
	})),
});
