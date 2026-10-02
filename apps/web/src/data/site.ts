/**
 * Identidade técnica da marca: o que não se edita pelo painel.
 *
 * Contato, WhatsApp, redes sociais e os textos das páginas saíram daqui na
 * spec 0008 — moram no banco, com o padrão em `@my-better-t-app/core`, e
 * chegam aos componentes por `useSiteContent()`.
 *
 * Nome e slogan ficam porque estão no logotipo e em dezenas de textos
 * alternativos: mudar um sem os outros deixaria o site incoerente.
 */

import { env } from "@my-better-t-app/env/web";

function resolveSiteUrl(): string {
	const raw = env.VITE_SITE_URL;
	return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

export const SITE = {
	name: "São Jorge Alimentos",
	legalName: "São Jorge Alimentos",
	url: resolveSiteUrl(),
	locale: "pt_BR",
	lang: "pt-BR",
	country: "BR",
	foundingYear: "1980",
	tagline: "Mais sabor em sua mesa",
	logo: "/images/logo-sao-jorge.png",
	/**
	 * Share card. Points at the hero photo so links preview correctly today —
	 * replace with a purpose-built 1200x630 image carrying the logo and tagline.
	 */
	ogImage: "/images/hero.webp",
} as const;
