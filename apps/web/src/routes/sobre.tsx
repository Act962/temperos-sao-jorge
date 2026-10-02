import { createFileRoute } from "@tanstack/react-router";
import { AboutTimeline } from "@/components/about/about-timeline";
import { ArchiveGallery } from "@/components/about/archive-gallery";
import { PageHeader } from "@/components/ui/page-header";
import { Eyebrow, SectionHeading } from "@/components/ui/section-heading";
import { buildPageSeo } from "@/lib/seo";
import { useSiteContent } from "@/lib/site-content";
import { breadcrumbSchema, jsonLdScript } from "@/lib/structured-data";

const DESCRIPTION =
	"Conheça a história da São Jorge Alimentos: mais de quatro décadas de produção familiar, ingredientes selecionados e presença nacional.";

export const Route = createFileRoute("/sobre")({
	head: () => {
		const seo = buildPageSeo({
			title: "Sobre nós",
			description: DESCRIPTION,
			path: "/sobre",
		});
		return {
			meta: seo.meta,
			links: seo.links,
			scripts: [
				jsonLdScript(
					breadcrumbSchema([
						{ name: "Início", path: "/" },
						{ name: "Sobre nós", path: "/sobre" },
					]),
				),
			],
		};
	},
	component: AboutPage,
});

function AboutPage() {
	const about = useSiteContent().about;

	return (
		<div className="bg-cream pt-18 pb-24">
			<div className="shell-narrow">
				<PageHeader title="Sobre nós" description={about.intro} />

				<div className="mt-15 grid items-start gap-11 lg:grid-cols-2">
					<div className="flex flex-col gap-5">
						{about.story.map((paragraph) => (
							<p
								key={paragraph.slice(0, 40)}
								className="text-pretty font-sans text-base text-ink-soft leading-[1.75]"
							>
								{paragraph}
							</p>
						))}
					</div>
					<ArchiveGallery />
				</div>

				<section aria-labelledby="linha-do-tempo" className="mt-24">
					<header className="mb-12 text-center">
						<Eyebrow className="mb-3">Nossa trajetória</Eyebrow>
						<SectionHeading id="linha-do-tempo" className="text-[2.25rem]">
							{about.timelineTitle}
						</SectionHeading>
					</header>
					<AboutTimeline entries={about.timeline} />
				</section>
			</div>
		</div>
	);
}
