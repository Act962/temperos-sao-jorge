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

			{/*
			 * O véu é vertical no celular e horizontal a partir de md. A versão
			 * de 90deg some no estreito: o texto passa a cair sobre a parte
			 * iluminada da foto e perde contraste.
			 */}
			<div
				aria-hidden="true"
				className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,10,9,0.55)_0%,rgba(18,10,9,0.82)_45%,rgba(18,10,9,0.92)_100%)] md:bg-[linear-gradient(90deg,rgba(18,10,9,0.94)_0%,rgba(18,10,9,0.72)_38%,rgba(18,10,9,0.15)_66%,rgba(18,10,9,0.05)_100%)]"
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

				<div className="mt-8 flex animate-brand-rise flex-wrap gap-3 [animation-delay:0.34s]">
					<BrandLink
						to="/produtos"
						size="lg"
						className="shadow-[0_6px_20px_rgba(0,0,0,0.35)]"
					>
						Ver os produtos
					</BrandLink>
					<BrandLink
						to="/sobre"
						size="lg"
						variant="light"
						className="bg-transparent text-[#fff8ec] ring-1 ring-[#fff8ec]/45 ring-inset hover:bg-[#fff8ec] hover:text-brand"
					>
						Nossa história
					</BrandLink>
				</div>
			</div>
		</section>
	);
}
