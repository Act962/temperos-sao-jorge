import { cn } from "@my-better-t-app/ui/lib/utils";
import { Reveal } from "@/components/ui/reveal";
import { TIMELINE } from "@/data/timeline";

/**
 * Linha do tempo da empresa.
 *
 * Duas formas, não uma encolhida: até lg é um trilho à esquerda com tudo
 * empilhado, que é o que cabe no celular; de lg em diante o trilho vai para o
 * centro e os marcos alternam de lado. A grade de cinco colunas que existia
 * antes espremia cinco textos em telas estreitas e dava à melhor história da
 * marca o menor peso da página.
 */
export function AboutTimeline() {
	const lastIndex = TIMELINE.length - 1;

	return (
		<ol className="relative">
			{/* Trilho: encostado à esquerda no estreito, centralizado no largo. */}
			<span
				aria-hidden="true"
				className="absolute top-3 bottom-3 left-[7px] w-px bg-brand/20 lg:left-1/2 lg:-translate-x-1/2"
			/>

			{TIMELINE.map((entry, index) => {
				const onLeft = index % 2 === 0;
				const isCurrent = index === lastIndex;

				return (
					<Reveal
						as="li"
						key={entry.year}
						delay={index * 90}
						className={cn(
							"relative pb-11 pl-9 last:pb-0",
							"lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-start lg:gap-x-12 lg:pb-14 lg:pl-0",
						)}
					>
						{/* Marcador sobre o trilho. */}
						<span
							aria-hidden="true"
							className={cn(
								"absolute top-2 left-0 size-3.5 shrink-0 rounded-full border-2 border-cream bg-brand",
								"lg:static lg:col-start-2 lg:row-start-1 lg:mt-2",
								isCurrent && "size-4 ring-3 ring-brand/25 lg:mt-1.5",
							)}
						/>

						<div
							className={cn(
								"rounded-lg border border-brand/12 bg-cream-raised px-5 py-4.5 shadow-[0_4px_14px_rgba(43,33,28,0.05)]",
								// No tablet o cartão esticaria a largura toda para duas linhas
								// de texto; na coluna do lg ele volta a preencher.
								"sm:max-w-2xl lg:row-start-1 lg:max-w-none",
								onLeft ? "lg:col-start-1 lg:text-right" : "lg:col-start-3",
							)}
						>
							<p
								className={cn(
									"font-bold font-display text-[1.75rem] leading-none tracking-[0.02em]",
									isCurrent ? "text-brand-bright" : "text-brand",
								)}
							>
								{entry.year}
							</p>
							<h3 className="mt-2.5 font-sans font-semibold text-[0.9375rem] text-ink leading-snug">
								{entry.title}
							</h3>
							<p className="mt-1.5 text-pretty font-sans text-[0.8125rem] text-ink-muted leading-relaxed">
								{entry.text}
							</p>
						</div>
					</Reveal>
				);
			})}
		</ol>
	);
}
