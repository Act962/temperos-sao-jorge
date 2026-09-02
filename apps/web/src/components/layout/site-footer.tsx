import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/layout/brand-logo";
import { NewsletterForm } from "@/components/layout/newsletter-form";
import { SocialLinks } from "@/components/layout/social-links";
import { SITE } from "@/data/site";

const LEGAL_LINKS = [
	{ label: "Política de privacidade", to: "/privacidade" },
	{ label: "Política de cookies", to: "/cookies" },
] as const;

/** Red site footer: brand mark, newsletter, social profiles and legal links. */
export function SiteFooter() {
	const year = new Date().getFullYear();

	return (
		<footer className="bg-brand pt-11 pb-10">
			<div className="shell grid items-center gap-12 md:grid-cols-2 lg:grid-cols-[1fr_1.1fr_0.7fr]">
				<div className="flex justify-center md:justify-start lg:justify-center">
					<Link
						to="/"
						aria-label="Ir para a página inicial"
						className="px-5 py-3.5"
					>
						<BrandLogo
							className="h-16 lg:h-[82px]"
							tone="cream"
							loading="lazy"
						/>
					</Link>
				</div>

				<section aria-labelledby="newsletter-heading">
					<h2
						id="newsletter-heading"
						className="font-bold font-sans text-cream-fg text-xs uppercase leading-normal tracking-[0.13em]"
					>
						Receba novidades e receitas
						<br />
						exclusivas no seu e-mail
					</h2>
					<NewsletterForm />
				</section>

				<section
					aria-labelledby="social-heading"
					className="md:col-span-2 lg:col-span-1"
				>
					<h2
						id="social-heading"
						className="mb-3.5 font-bold font-sans text-cream-fg text-xs uppercase tracking-[0.13em]"
					>
						Siga a São Jorge
					</h2>
					<SocialLinks />
				</section>
			</div>

			<div className="shell mt-8">
				<div className="flex flex-col justify-between gap-5 border-cream-fg/20 border-t pt-4.5 font-sans text-cream-fg/70 text-xs sm:flex-row">
					<p>
						© {year} {SITE.name}. Todos os direitos reservados.
					</p>
					<nav aria-label="Links legais">
						<ul className="flex gap-5.5">
							{LEGAL_LINKS.map((link) => (
								<li key={link.to}>
									<Link
										to={link.to}
										className="transition-colors hover:text-white"
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</nav>
				</div>
			</div>
		</footer>
	);
}
