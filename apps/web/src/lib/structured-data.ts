import type { Product } from "@/data/products";
import type { Recipe } from "@/data/recipes";
import { CONTACT, SITE, SOCIAL_LINKS } from "@/data/site";
import { absoluteUrl, canonicalUrl } from "@/lib/seo";

/**
 * schema.org payloads.
 *
 * Everything here is derived from data we actually hold. The postal address is
 * emitted only when `CONTACT.hasVerifiedAddress` is true — publishing a
 * placeholder address as structured data would feed search engines a fact that
 * is not true.
 */

type JsonLdValue = Record<string, unknown>;

const ORGANIZATION_ID = `${SITE.url}/#organization`;
const WEBSITE_ID = `${SITE.url}/#website`;

/** Wraps a payload in the head-script entry TanStack Router renders. */
export function jsonLdScript(data: JsonLdValue) {
	return {
		type: "application/ld+json",
		children: JSON.stringify(data),
	};
}

function postalAddress(): JsonLdValue | undefined {
	if (!CONTACT.hasVerifiedAddress) return undefined;
	return {
		"@type": "PostalAddress",
		streetAddress: CONTACT.street,
		addressLocality: CONTACT.city,
		addressRegion: CONTACT.state,
		postalCode: CONTACT.postalCode,
		addressCountry: CONTACT.country,
	};
}

export function organizationSchema(): JsonLdValue {
	const address = postalAddress();
	return {
		"@context": "https://schema.org",
		"@type": "Organization",
		"@id": ORGANIZATION_ID,
		name: SITE.name,
		legalName: SITE.legalName,
		url: `${SITE.url}/`,
		logo: absoluteUrl(SITE.logo),
		image: absoluteUrl(SITE.ogImage),
		description: SITE.description,
		foundingDate: SITE.foundingYear,
		sameAs: SOCIAL_LINKS.map((link) => link.href),
		contactPoint: [
			{
				"@type": "ContactPoint",
				contactType: "customer service",
				telephone: CONTACT.phoneE164,
				email: CONTACT.email,
				areaServed: "BR",
				availableLanguage: ["Portuguese"],
			},
		],
		...(address ? { address } : {}),
	};
}

export function webSiteSchema(): JsonLdValue {
	return {
		"@context": "https://schema.org",
		"@type": "WebSite",
		"@id": WEBSITE_ID,
		name: SITE.name,
		url: `${SITE.url}/`,
		inLanguage: SITE.lang,
		publisher: { "@id": ORGANIZATION_ID },
	};
}

export interface Crumb {
	readonly name: string;
	readonly path: string;
}

export function breadcrumbSchema(crumbs: readonly Crumb[]): JsonLdValue {
	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: crumbs.map((crumb, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: crumb.name,
			item: canonicalUrl(crumb.path),
		})),
	};
}

/**
 * Product listing. We do not publish `Product` entities because the catalogue
 * carries no price or availability — an `ItemList` describes the page honestly.
 */
export function productListSchema(
	products: readonly Product[],
	path: string,
): JsonLdValue {
	return {
		"@context": "https://schema.org",
		"@type": "ItemList",
		name: "Produtos São Jorge Alimentos",
		url: canonicalUrl(path),
		numberOfItems: products.length,
		itemListElement: products.map((product, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: product.name,
			image: absoluteUrl(product.image),
		})),
	};
}

/** Minutes -> ISO 8601 duration, e.g. 80 -> "PT1H20M". */
function isoDuration(minutes: number): string {
	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	return `PT${hours > 0 ? `${hours}H` : ""}${rest > 0 ? `${rest}M` : ""}`;
}

export function recipeSchema(recipe: Recipe): JsonLdValue {
	return {
		"@context": "https://schema.org",
		"@type": "Recipe",
		name: recipe.name,
		url: canonicalUrl(`/receitas/${recipe.slug}`),
		image: [absoluteUrl(recipe.image)],
		description: recipe.summary,
		inLanguage: SITE.lang,
		recipeCategory: recipe.category,
		recipeYield: `${recipe.servings} porções`,
		totalTime: isoDuration(recipe.minutes),
		recipeIngredient: [...recipe.ingredients],
		recipeInstructions: recipe.steps.map((step, index) => ({
			"@type": "HowToStep",
			position: index + 1,
			text: step,
		})),
		author: { "@id": ORGANIZATION_ID },
		publisher: { "@id": ORGANIZATION_ID },
	};
}

export function recipeListSchema(
	recipes: readonly Recipe[],
	path: string,
): JsonLdValue {
	return {
		"@context": "https://schema.org",
		"@type": "ItemList",
		name: "Receitas São Jorge Alimentos",
		url: canonicalUrl(path),
		numberOfItems: recipes.length,
		itemListElement: recipes.map((recipe, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: recipe.name,
			url: canonicalUrl(`/receitas/${recipe.slug}`),
		})),
	};
}

/** Emitted on the contact page only once a real address has been verified. */
export function localBusinessSchema(): JsonLdValue | undefined {
	const address = postalAddress();
	if (!address) return undefined;
	return {
		"@context": "https://schema.org",
		"@type": "FoodEstablishment",
		name: SITE.name,
		url: canonicalUrl("/contato"),
		image: absoluteUrl(SITE.ogImage),
		telephone: CONTACT.phoneE164,
		email: CONTACT.email,
		address,
		openingHours: CONTACT.openingHoursSpec,
		parentOrganization: { "@id": ORGANIZATION_ID },
	};
}
