/**
 * Single source of truth for brand identity, contact details and SEO defaults.
 *
 * NOTE: the contact block below still carries the placeholder values that came
 * from the design canvas. Replace them with the real ones before launch — they
 * feed the contact page, the footer and the JSON-LD emitted for search engines.
 * `hasVerifiedAddress` gates the LocalBusiness structured data so we never
 * publish a fabricated postal address to Google.
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
	foundingYear: "1980",
	tagline: "Mais sabor em sua mesa",
	description:
		"Há mais de 40 anos a São Jorge Alimentos leva temperos, chás, ervas, molhos e grãos de qualidade para a mesa das famílias brasileiras.",
	logo: "/images/logo-sao-jorge.png",
	/**
	 * Share card. Points at the hero photo so links preview correctly today —
	 * replace with a purpose-built 1200x630 image carrying the logo and tagline.
	 */
	ogImage: "/images/hero.webp",
} as const;

export const CONTACT = {
	/** Flip to true only once the address below is the real, verified one. */
	hasVerifiedAddress: false,
	phone: "(11) 3000-0000",
	phoneE164: "+551130000000",
	email: "sac@saojorgealimentos.com.br",
	street: "Rua das Indústrias, 123",
	district: "Bairro Industrial",
	city: "São Paulo",
	state: "SP",
	postalCode: "00000-000",
	country: "BR",
	openingHours: "Segunda a sexta, 8h às 17h",
	/** schema.org openingHours syntax, mirrors `openingHours` above. */
	openingHoursSpec: "Mo-Fr 08:00-17:00",
} as const;

export const SOCIAL_LINKS = [
	{ name: "Instagram", href: "https://www.instagram.com/", icon: "instagram" },
	{ name: "Facebook", href: "https://www.facebook.com/", icon: "facebook" },
	{ name: "YouTube", href: "https://www.youtube.com/", icon: "youtube" },
] as const;

export const CONTACT_SUBJECTS = [
	"Atendimento ao consumidor",
	"Quero ser distribuidor",
	"Trabalhe conosco",
	"Imprensa",
] as const;

export type SocialLink = (typeof SOCIAL_LINKS)[number];
