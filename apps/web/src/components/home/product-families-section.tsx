import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { CurveDivider } from "@/components/ui/curve-divider";
import { ProductImage } from "@/components/ui/product-image";
import { Reveal } from "@/components/ui/reveal";
import { FEATURED_FAMILIES } from "@/data/home";

/** Red band showing every product family. */
export function ProductFamiliesSection() {
	return (
		<section className="relative mt-[-2px] bg-brand pt-11 pb-26">
			<CurveDivider fill="var(--color-brand)" variant="brand" />

			<div className="shell">
				<p className="mb-3.5 font-bold font-sans text-brand-blush text-xs uppercase tracking-[0.2em]">
					Família dos produtos
				</p>
				<Reveal>
					<h2 className="mb-11 font-display font-extrabold text-[2.25rem] text-cream-fg uppercase leading-[1.05] sm:text-[2.75rem]">
						Para cada receita,
						<br />
						uma escolha
						<span className="text-brand-rose">.</span>
					</h2>
				</Reveal>

				<ul className="grid grid-cols-1 gap-5.5 sm:grid-cols-2 lg:grid-cols-4">
					{FEATURED_FAMILIES.map((family, index) => (
						<Reveal as="li" key={family.slug} delay={index * 110}>
							<Link
								to="/produtos/$familia"
								params={{ familia: family.slug }}
								className="group block h-full overflow-hidden rounded-md bg-cream-raised shadow-[0_10px_26px_rgba(0,0,0,0.22)] transition-shadow hover:shadow-[0_18px_38px_rgba(0,0,0,0.34)]"
							>
								<div className="h-53 bg-cream-bright p-5">
									<ProductImage src={family.image} alt={family.imageAlt} />
								</div>
								<div className="px-4.5 pt-4 pb-4.5">
									<h3 className="font-sans font-semibold text-[1.0625rem] text-ink leading-snug">
										{family.name}
									</h3>
									<p className="mt-2 flex items-center gap-2 font-sans font-semibold text-[0.8125rem] text-brand-bright">
										{family.count} produtos
										<ArrowRight
											aria-hidden="true"
											className="size-4 transition-transform group-hover:translate-x-1"
										/>
									</p>
								</div>
							</Link>
						</Reveal>
					))}
				</ul>
			</div>
		</section>
	);
}
