import { createFileRoute } from "@tanstack/react-router";
import { AboutTimeline } from "@/components/about/about-timeline";
import { ArchiveGallery } from "@/components/about/archive-gallery";
import { PageHeader } from "@/components/ui/page-header";
import { buildPageSeo } from "@/lib/seo";
import { breadcrumbSchema, jsonLdScript } from "@/lib/structured-data";

const DESCRIPTION =
	"Conheça a história da São Jorge Alimentos: mais de quatro décadas de produção familiar, ingredientes selecionados e presença nacional.";

const STORY = [
	"Fundada com o propósito de oferecer alimentos de qualidade, a São Jorge Alimentos nasceu de um sonho familiar. Começamos pequenos, com um caminhão, uma linha de massas e a convicção de que comida boa aproxima as pessoas.",
	"Ao longo de mais de quatro décadas ampliamos a produção, modernizamos nossas fábricas e crescemos junto com as famílias que confiam na nossa marca. Massas, molhos e temperos passaram a fazer parte do dia a dia de milhares de casas em todo o Brasil.",
	"O que não mudou foi o cuidado: ingredientes selecionados, processos rigorosos e o compromisso de levar mais sabor para a sua mesa.",
];

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
	return (
		<div className="bg-cream pt-18 pb-24">
			<div className="shell-narrow">
				<PageHeader
					title="Sobre nós"
					description="Nossa história é feita de pessoas e propósito."
				/>

				<div className="mt-15 grid items-start gap-11 lg:grid-cols-2">
					<div className="flex flex-col gap-5">
						{STORY.map((paragraph) => (
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

				<section aria-labelledby="linha-do-tempo" className="mt-20">
					<h2 id="linha-do-tempo" className="sr-only">
						Linha do tempo da São Jorge Alimentos
					</h2>
					<AboutTimeline />
				</section>
			</div>
		</div>
	);
}
