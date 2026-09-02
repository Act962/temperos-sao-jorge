import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/layout/brand-logo";
import { NewsletterForm } from "@/components/layout/newsletter-form";
import { SocialLinks } from "@/components/layout/social-links";
import { WhatsappIcon } from "@/components/ui/whatsapp-icon";
import { PRODUCT_FAMILIES } from "@/data/products";
import { CONTACT, SITE, whatsappUrl } from "@/data/site";

const INSTITUTIONAL_LINKS = [
	{ label: "Sobre nós", to: "/sobre" },
	{ label: "Receitas", to: "/receitas" },
	{ label: "Contato", to: "/contato" },
] as const;

const LEGAL_LINKS = [
	{ label: "Política de privacidade", to: "/privacidade" },
	{ label: "Política de cookies", to: "/cookies" },
] as const;

const HEADING =
	"font-bold font-sans text-cream-fg text-xs uppercase tracking-[0.13em]";
const LINK = "text-cream-fg/75 transition-colors hover:text-cream-fg";

/**
 * Rodapé do site.
 *
 * Carrega o mapa de navegação e o endereço além da newsletter: antes eles só
 * existiam dentro de /contato, o que deixava o fim de página sem saída e
 * escondia o sinal local de endereço e telefone.
 */
export function SiteFooter() {
	const year = new Date().getFullYear();
	const whatsapp = whatsappUrl();

	return (
		<footer className="bg-brand pt-14 pb-10 font-sans text-[0.8125rem]">
			<div className="shell grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.15fr_1fr_0.8fr_1.15fr]">
				<div className="flex flex-col gap-5">
					<Link to="/" aria-label="Ir para a página inicial">
						<BrandLogo className="h-14" tone="cream" loading="lazy" />
					</Link>

					<address className="space-y-3 text-cream-fg/75 not-italic leading-relaxed">
						<p>
							{CONTACT.street}
							<br />
							{CONTACT.district}
							<br />
							{CONTACT.city} — {CONTACT.state}
							<br />
							CEP {CONTACT.postalCode}
						</p>
						<p className="flex flex-col gap-1">
							<a href={`tel:${CONTACT.phoneE164}`} className={LINK}>
								{CONTACT.phone}
							</a>
							<a href={`mailto:${CONTACT.email}`} className={LINK}>
								{CONTACT.email}
							</a>
						</p>
					</address>

					{whatsapp ? (
						<a
							href={whatsapp}
							target="_blank"
							rel="noreferrer noopener"
							className="inline-flex w-fit items-center gap-2 rounded-[4px] bg-cream-fg/15 px-3.5 py-2.5 font-semibold text-cream-fg transition-colors hover:bg-cream-fg/25"
						>
							<WhatsappIcon className="size-4" />
							Falar no WhatsApp
						</a>
					) : null}
				</div>

				<nav aria-labelledby="footer-produtos">
					<h2 id="footer-produtos" className={HEADING}>
						Produtos
					</h2>
					<ul className="mt-4 flex flex-col gap-2.5">
						{PRODUCT_FAMILIES.map((family) => (
							<li key={family.slug}>
								<Link
									to="/produtos/$familia"
									params={{ familia: family.slug }}
									className={LINK}
								>
									{family.name}
								</Link>
							</li>
						))}
					</ul>
				</nav>

				<nav aria-labelledby="footer-institucional">
					<h2 id="footer-institucional" className={HEADING}>
						Institucional
					</h2>
					<ul className="mt-4 flex flex-col gap-2.5">
						<li>
							<Link to="/produtos" className={LINK}>
								Todos os produtos
							</Link>
						</li>
						{INSTITUTIONAL_LINKS.map((link) => (
							<li key={link.to}>
								<Link to={link.to} className={LINK}>
									{link.label}
								</Link>
							</li>
						))}
						{LEGAL_LINKS.map((link) => (
							<li key={link.to}>
								<Link to={link.to} className={LINK}>
									{link.label}
								</Link>
							</li>
						))}
					</ul>
				</nav>

				<div className="flex flex-col gap-8">
					<section aria-labelledby="newsletter-heading">
						<h2 id="newsletter-heading" className={HEADING}>
							Receba novidades e receitas
						</h2>
						<NewsletterForm />
						<p className="mt-2.5 text-cream-fg/55 text-xs leading-relaxed">
							Ao enviar, você concorda com a nossa{" "}
							<Link to="/privacidade" className="underline hover:text-cream-fg">
								Política de Privacidade
							</Link>
							.
						</p>
					</section>

					<section aria-labelledby="social-heading">
						<h2 id="social-heading" className={HEADING}>
							Siga a São Jorge
						</h2>
						<SocialLinks className="mt-4" />
					</section>
				</div>
			</div>

			<div className="shell mt-12">
				<div className="flex flex-col justify-between gap-3 border-cream-fg/20 border-t pt-5 text-cream-fg/60 text-xs sm:flex-row">
					<p>
						© {year} {SITE.name}. Todos os direitos reservados.
					</p>
					<p>{CONTACT.openingHours}</p>
				</div>
			</div>
		</footer>
	);
}
