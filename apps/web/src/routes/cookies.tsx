import { createFileRoute } from "@tanstack/react-router";
import { LegalDocument } from "@/components/legal/legal-document";
import { catalogQuery } from "@/lib/catalog";
import { buildPageSeo } from "@/lib/seo";
import { breadcrumbSchema, jsonLdScript } from "@/lib/structured-data";

export const Route = createFileRoute("/cookies")({
	loader: async ({ context }) => {
		const catalog = await context.queryClient.ensureQueryData(catalogQuery);
		return catalog.content.cookies;
	},

	head: ({ loaderData }) => {
		if (!loaderData) return {};
		const seo = buildPageSeo({
			title: loaderData.title,
			description: loaderData.summary,
			path: "/cookies",
		});
		return {
			meta: seo.meta,
			links: seo.links,
			scripts: [
				jsonLdScript(
					breadcrumbSchema([
						{ name: "Início", path: "/" },
						{ name: loaderData.title, path: "/cookies" },
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
			<LegalDocument document={Route.useLoaderData()} />
		</div>
	);
}
