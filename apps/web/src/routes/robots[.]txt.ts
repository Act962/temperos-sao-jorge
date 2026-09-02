import { createFileRoute } from "@tanstack/react-router";
import { SITE } from "@/data/site";

/**
 * robots.txt, served dynamically so the sitemap URL always matches the origin
 * configured in `VITE_SITE_URL`.
 */
function renderRobots(): string {
	return [
		"User-agent: *",
		"Allow: /",
		"",
		`Sitemap: ${SITE.url}/sitemap.xml`,
		"",
	].join("\n");
}

export const Route = createFileRoute("/robots.txt")({
	server: {
		handlers: {
			GET: () =>
				new Response(renderRobots(), {
					headers: {
						"content-type": "text/plain; charset=utf-8",
						"cache-control": "public, max-age=3600",
					},
				}),
		},
	},
});
