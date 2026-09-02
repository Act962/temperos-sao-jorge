import { createFileRoute } from "@tanstack/react-router";
import { ContactForm } from "@/components/contact/contact-form";
import { ContactInfo } from "@/components/contact/contact-info";
import { PageHeader } from "@/components/ui/page-header";
import { buildPageSeo } from "@/lib/seo";
import {
	breadcrumbSchema,
	jsonLdScript,
	localBusinessSchema,
} from "@/lib/structured-data";

const DESCRIPTION =
	"Fale com a São Jorge Alimentos: atendimento ao consumidor, oportunidades de distribuição, trabalhe conosco e imprensa.";

export const Route = createFileRoute("/contato")({
	head: () => {
		const seo = buildPageSeo({
			title: "Contato",
			description: DESCRIPTION,
			path: "/contato",
		});
		const localBusiness = localBusinessSchema();
		return {
			meta: seo.meta,
			links: seo.links,
			scripts: [
				jsonLdScript(
					breadcrumbSchema([
						{ name: "Início", path: "/" },
						{ name: "Contato", path: "/contato" },
					]),
				),
				...(localBusiness ? [jsonLdScript(localBusiness)] : []),
			],
		};
	},
	component: ContactPage,
});

function ContactPage() {
	return (
		<div className="bg-cream pt-16 pb-24">
			<div className="shell-narrow">
				<PageHeader
					title="Contato"
					description="Estamos aqui para falar com você."
				/>

				<div className="mt-13 grid items-start gap-14 lg:grid-cols-[1.3fr_0.8fr]">
					<ContactForm />
					<ContactInfo />
				</div>
			</div>
		</div>
	);
}
