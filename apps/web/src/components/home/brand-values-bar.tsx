import { preencherContagens } from "@my-better-t-app/core";
import { BookOpen, Leaf, ShieldCheck, UtensilsCrossed } from "lucide-react";
import type { ComponentType } from "react";
import { Reveal } from "@/components/ui/reveal";
import { useCatalog } from "@/lib/catalog";

type Icon = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

/**
 * Um ícone por posição. Os textos são editados no painel; os ícones não, e é
 * por isso que o domínio exige exatamente quatro compromissos.
 */
const ICONS: readonly Icon[] = [Leaf, ShieldCheck, BookOpen, UtensilsCrossed];

/** Faixa de fechamento da home, entre as receitas e o rodapé. */
export function BrandValuesBar() {
	const { products, families, content } = useCatalog();
	// "{produtos}" e "{familias}" saem do próprio catálogo, então o número não
	// envelhece quando um produto entra ou sai.
	const contagens = { produtos: products.length, familias: families.length };

	return (
		<section
			aria-label="Compromissos da São Jorge Alimentos"
			className="mt-20 border-brand/12 border-t bg-cream-sunken py-16 lg:py-20"
		>
			<ul className="shell grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-12">
				{content.home.values.map((value, index) => {
					const Icone = ICONS[index] ?? Leaf;
					return (
						<Reveal as="li" key={value.title} delay={index * 90}>
							<span
								aria-hidden="true"
								className="mb-5 flex size-12 items-center justify-center rounded-full bg-brand/8 text-brand"
							>
								<Icone className="size-6" />
							</span>
							<h3 className="font-sans font-semibold text-[1.0625rem] text-ink leading-snug">
								{preencherContagens(value.title, contagens)}
							</h3>
							<p className="mt-2 text-pretty font-sans text-[0.875rem] text-ink-muted leading-relaxed">
								{preencherContagens(value.text, contagens)}
							</p>
						</Reveal>
					);
				})}
			</ul>
		</section>
	);
}
