import { BookOpen, Leaf, ShieldCheck, UtensilsCrossed } from "lucide-react";
import type { ComponentType } from "react";
import { Reveal } from "@/components/ui/reveal";
import { PRODUCT_FAMILIES, PRODUCTS } from "@/data/products";
import { TIMELINE } from "@/data/timeline";

interface BrandValue {
	readonly icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
	readonly title: string;
	readonly text: string;
}

const foundingYear = TIMELINE[0]?.year ?? "1980";

/**
 * As quatro promessas de fechamento da home.
 *
 * Os números saem do próprio catálogo, então não envelhecem quando um produto
 * entra ou sai. Antes eram quatro rótulos em caixa-alta de 12 px numa faixa
 * fininha logo acima do rodapé — a promessa central da marca com cara de letra
 * miúda.
 */
const VALUES: readonly BrandValue[] = [
	{
		icon: Leaf,
		title: "Ingredientes selecionados",
		text: "Ervas, grãos e especiarias escolhidos para chegar à sua cozinha com todo o sabor.",
	},
	{
		icon: ShieldCheck,
		title: "Qualidade que você confia",
		text: "O mesmo padrão do sachê de tempero ao saco de 1 kg da linha institucional.",
	},
	{
		icon: BookOpen,
		title: `Tradição desde ${foundingYear}`,
		text: "Quatro décadas de história de família, da primeira fábrica à mesa de todo o Brasil.",
	},
	{
		icon: UtensilsCrossed,
		title: "Variedade para o dia a dia",
		text: `${PRODUCTS.length} produtos em ${PRODUCT_FAMILIES.length} famílias, do chá da noite ao tempero do almoço.`,
	},
];

/** Faixa de fechamento da home, entre as receitas e o rodapé. */
export function BrandValuesBar() {
	return (
		<section
			aria-label="Compromissos da São Jorge Alimentos"
			className="mt-20 border-brand/12 border-t bg-cream-sunken py-16 lg:py-20"
		>
			<ul className="shell grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-12">
				{VALUES.map((value, index) => (
					<Reveal as="li" key={value.title} delay={index * 90}>
						<span
							aria-hidden="true"
							className="mb-5 flex size-12 items-center justify-center rounded-full bg-brand/8 text-brand"
						>
							<value.icon className="size-6" />
						</span>
						<h3 className="font-sans font-semibold text-[1.0625rem] text-ink leading-snug">
							{value.title}
						</h3>
						<p className="mt-2 text-pretty font-sans text-[0.875rem] text-ink-muted leading-relaxed">
							{value.text}
						</p>
					</Reveal>
				))}
			</ul>
		</section>
	);
}
