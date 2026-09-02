import { createFileRoute } from "@tanstack/react-router";
import { LegalDocument } from "@/components/legal/legal-document";
import { PRIVACY_POLICY } from "@/data/legal";
import { buildPageSeo } from "@/lib/seo";
import { breadcrumbSchema, jsonLdScript } from "@/lib/structured-data";

export const Route = createFileRoute("/privacidade")({
	head: () => {
		const seo = buildPageSeo({
			title: PRIVACY_POLICY.title,
			description: PRIVACY_POLICY.summary,
			path: "/privacidade",
		});
		return {
			meta: seo.meta,
			links: seo.links,
			scripts: [
				jsonLdScript(
					breadcrumbSchema([
						{ name: "Início", path: "/" },
						{ name: PRIVACY_POLICY.title, path: "/privacidade" },
					]),
				),
			],
		};
	},
	component: PrivacyPage,
});

function PrivacyPage() {
	return (
		<div className="bg-cream pt-16 pb-24">
			<LegalDocument document={PRIVACY_POLICY} />
		</div>
	);
}
