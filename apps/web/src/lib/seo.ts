import { SITE } from "@/data/site";

/**
 * Head-tag builder shared by every route.
 *
 * Returns the exact shape TanStack Router's `head` option expects, so a route
 * only has to describe *what* the page is — never how to spell a meta tag.
 */

export interface PageSeoInput {
	/** Page title without the brand suffix. Omit on the home page. */
	title?: string;
	description: string;
	/** Absolute path starting with "/", e.g. "/produtos". */
	path: string;
	/** Absolute path to a share image. Falls back to the brand OG image. */
	image?: string;
	/** Open Graph object type. */
	type?: "website" | "article";
	/** Keep the page out of the index (thank-you pages, internal tools). */
	noIndex?: boolean;
}

export interface PageSeo {
	meta: Array<Record<string, string>>;
	links: Array<Record<string, string>>;
}

export function canonicalUrl(path: string): string {
	if (path === "/") return `${SITE.url}/`;
	return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}

export function absoluteUrl(path: string): string {
	if (/^https?:\/\//.test(path)) return path;
	return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}

export function pageTitle(title?: string): string {
	if (!title) return `${SITE.name} — ${SITE.tagline}`;
	return `${title} | ${SITE.name}`;
}

export function buildPageSeo({
	title,
	description,
	path,
	image,
	type = "website",
	noIndex = false,
}: PageSeoInput): PageSeo {
	const url = canonicalUrl(path);
	const fullTitle = pageTitle(title);
	const shareImage = absoluteUrl(image ?? SITE.ogImage);

	return {
		meta: [
			{ title: fullTitle },
			{ name: "description", content: description },
			{
				name: "robots",
				content: noIndex
					? "noindex, nofollow"
					: "index, follow, max-image-preview:large",
			},

			{ property: "og:type", content: type },
			{ property: "og:title", content: fullTitle },
			{ property: "og:description", content: description },
			{ property: "og:url", content: url },
			{ property: "og:image", content: shareImage },
			{ property: "og:image:alt", content: `${SITE.name} — ${SITE.tagline}` },

			{ name: "twitter:card", content: "summary_large_image" },
			{ name: "twitter:title", content: fullTitle },
			{ name: "twitter:description", content: description },
			{ name: "twitter:image", content: shareImage },
		],
		links: [{ rel: "canonical", href: url }],
	};
}
