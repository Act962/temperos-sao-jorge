import { Fragment } from "react";
import { FamilyCarousel } from "@/components/home/family-carousel";
import { CurveDivider } from "@/components/ui/curve-divider";
import { Reveal } from "@/components/ui/reveal";
import { featuredFamilies } from "@/data/home";
import { useCatalog } from "@/lib/catalog";

/** Faixa vermelha com o carrossel das famílias de produtos. */
export function ProductFamiliesSection() {
	const { families, products, content } = useCatalog();
	const secao = content.home.families;
	const linhas = secao.title.split("\n");

	return (
		<section className="relative mt-[-2px] bg-brand pt-11 pb-26">
			<CurveDivider fill="var(--color-brand)" variant="brand" />

			<div className="shell">
				<p className="mb-3.5 font-bold font-sans text-brand-blush text-xs uppercase tracking-[0.2em]">
					Família dos produtos
				</p>
				<Reveal>
					<h2 className="mb-11 font-display font-extrabold text-[2.25rem] text-cream-fg uppercase leading-[1.05] sm:text-[2.75rem]">
						{linhas.map((linha, indice) => (
							<Fragment key={`${indice}-${linha}`}>
								{indice > 0 ? <br /> : null}
								{linha}
							</Fragment>
						))}
						<span className="text-brand-rose">.</span>
					</h2>
				</Reveal>

				<FamilyCarousel
					families={featuredFamilies(families, products, secao.representatives)}
				/>
			</div>
		</section>
	);
}
