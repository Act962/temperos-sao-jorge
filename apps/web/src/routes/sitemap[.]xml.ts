import { createFileRoute } from "@tanstack/react-router";
import { canonicalUrl } from "@/lib/seo";
import { getSiteRoutes } from "@/lib/site-routes";

/** XML sitemap, generated from the route registry in `lib/site-routes`. */
function renderSitemap(catalog: Parameters<typeof getSiteRoutes>[0]): string {
	const lastModified = new Date().toISOString().slice(0, 10);

	const urls = getSiteRoutes(catalog)
		.map(
			(route) =>
				"  <url>\n" +
				`    <loc>${canonicalUrl(route.path)}</loc>\n` +
				`    <lastmod>${lastModified}</lastmod>\n` +
				`    <changefreq>${route.changeFrequency}</changefreq>\n` +
				`    <priority>${route.priority.toFixed(1)}</priority>\n` +
				"  </url>",
		)
		.join("\n");

	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export const Route = createFileRoute("/sitemap.xml")({
	server: {
		handlers: {
			GET: async () => {
				// Import dinâmico pelo mesmo motivo das rotas de API: o módulo do
				// catálogo alcança o banco, e isso não pode entrar no boot do site.
				const { loadCatalog } = await import("@/server/catalog.server");

				return new Response(renderSitemap(await loadCatalog()), {
					headers: {
						"content-type": "application/xml; charset=utf-8",
						"cache-control": "public, max-age=3600",
					},
				});
			},
		},
	},
});
