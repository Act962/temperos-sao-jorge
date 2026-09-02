import { createFileRoute } from "@tanstack/react-router";
import { LegalDocument } from "@/components/legal/legal-document";
import { COOKIE_POLICY } from "@/data/legal";
import { buildPageSeo } from "@/lib/seo";
import { breadcrumbSchema, jsonLdScript } from "@/lib/structured-data";

export const Route = createFileRoute("/cookies")({
	head: () => {
		const seo = buildPageSeo({
			title: COOKIE_POLICY.title,
			description: COOKIE_POLICY.summary,
			path: "/cookies",
		});
		return {
			meta: seo.meta,
			links: seo.links,
			scripts: [
				jsonLdScript(
					breadcrumbSchema([
						{ name: "Início", path: "/" },
						{ name: COOKIE_POLICY.title, path: "/cookies" },
					]),
				),
			],
		};
	},
	component: CookiesPage,
});

function CookiesPage() {
	return (
		<div className="bg-cream pt-16 pb-24">
			<LegalDocument document={COOKIE_POLICY} />
		</div>
	);
}
