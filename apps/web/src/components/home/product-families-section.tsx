import { FamilyCarousel } from "@/components/home/family-carousel";
import { CurveDivider } from "@/components/ui/curve-divider";
import { Reveal } from "@/components/ui/reveal";
import { FEATURED_FAMILIES } from "@/data/home";

/** Faixa vermelha com o carrossel das famílias de produtos. */
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

				<FamilyCarousel families={FEATURED_FAMILIES} />
			</div>
		</section>
	);
}
