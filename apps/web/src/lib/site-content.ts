import {
	type RedeSocial,
	type SiteSettings,
	telefoneInternacional,
} from "@my-better-t-app/core";
import { useCatalog } from "@/lib/catalog";

/**
 * O conteúdo editável do site — configurações e textos das páginas.
 *
 * Viaja junto com o catálogo, na mesma leitura e no mesmo cache: uma edição
 * em Configurações expira o mesmo cache que um produto renomeado.
 */
export function useSiteContent() {
	return useCatalog().content;
}

const NOME_DA_REDE: Record<RedeSocial, string> = {
	instagram: "Instagram",
	facebook: "Facebook",
	youtube: "YouTube",
};

export function socialName(platform: RedeSocial): string {
	return NOME_DA_REDE[platform];
}

/** Link pronto do WhatsApp, ou null quando não há número configurado. */
export function whatsappUrl(settings: SiteSettings): string | null {
	const { number, message } = settings.whatsapp;
	if (!number) return null;
	const destino = `https://wa.me/${telefoneInternacional(number)}`;
	return message ? `${destino}?text=${encodeURIComponent(message)}` : destino;
}

/** O telefone no formato do `tel:` e do JSON-LD: "+5511..." */
export function phoneE164(phone: string): string {
	return `+${telefoneInternacional(phone)}`;
}
