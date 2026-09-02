import { BookOpen, CircleCheck, Home, Sprout } from "lucide-react";
import type { ComponentType } from "react";
import { Reveal } from "@/components/ui/reveal";

interface BrandValue {
	readonly icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
	readonly lines: readonly [string, string];
}

const VALUES: readonly BrandValue[] = [
	{ icon: Sprout, lines: ["Ingredientes", "selecionados"] },
	{ icon: CircleCheck, lines: ["Qualidade que", "você confia"] },
	{ icon: BookOpen, lines: ["Tradição que", "atravessa gerações"] },
	{ icon: Home, lines: ["Sabor que faz", "parte da sua história"] },
];

/** Four brand promises closing the home page. */
export function BrandValuesBar() {
	return (
		<div className="mt-19 border-brand/14 border-t bg-cream-sunken">
			<Reveal className="shell grid grid-cols-1 gap-7 py-7.5 sm:grid-cols-2 lg:grid-cols-4">
				{VALUES.map((value) => (
					<div
						key={value.lines.join(" ")}
						className="flex items-center gap-3.5"
					>
						<value.icon
							aria-hidden
							className="size-6.5 shrink-0 text-brand-bright"
						/>
						<p className="font-sans font-semibold text-ink-soft text-xs uppercase leading-snug tracking-[0.1em]">
							{value.lines[0]}
							<br />
							{value.lines[1]}
						</p>
					</div>
				))}
			</Reveal>
		</div>
	);
}
