import { BrandLink } from "@/components/ui/brand-button";

/**
 * Above-the-fold hero. The photograph is eager and high-priority because it is
 * the Largest Contentful Paint element on the home page.
 */
export function HeroSection() {
	return (
		<section className="relative h-[520px] overflow-hidden bg-night md:h-160">
			<img
				src="/images/hero.webp"
				alt="Prato de massa servido à mesa com temperos São Jorge"
				fetchPriority="high"
				decoding="async"
				className="absolute inset-0 size-full animate-brand-ken-burns object-cover"
			/>

			<div
				aria-hidden="true"
				className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,10,9,0.94)_0%,rgba(18,10,9,0.72)_38%,rgba(18,10,9,0.15)_66%,rgba(18,10,9,0.05)_100%)]"
			/>

			<div className="shell relative flex h-full flex-col justify-center">
				<h1 className="animate-brand-rise font-display font-extrabold text-[#fff8ec] text-[3rem] uppercase leading-[0.94] tracking-[0.01em] [text-shadow:0_3px_18px_rgba(0,0,0,0.45)] sm:text-[4rem] lg:text-[4.75rem]">
					Mais sabor
					<br />
					em sua mesa
					<span className="text-[#d93a3a]">.</span>
				</h1>

				<p className="mt-6.5 max-w-[26rem] animate-brand-rise font-sans text-[#efe3d2] text-[1.0625rem] leading-relaxed [animation-delay:0.18s]">
					Há mais de 40 anos levando qualidade e sabor para o dia a dia das
					famílias brasileiras.
				</p>

				<div className="mt-8 animate-brand-rise [animation-delay:0.34s]">
					<BrandLink
						to="/sobre"
						size="lg"
						className="shadow-[0_6px_20px_rgba(0,0,0,0.35)]"
					>
						Conheça nossa história
					</BrandLink>
				</div>
			</div>
		</section>
	);
}
