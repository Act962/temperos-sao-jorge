import type { LegalDocument as LegalDocumentData } from "@/data/legal";

interface LegalDocumentProps {
	document: LegalDocumentData;
}

/** Shared shell for the privacy and cookie policy pages. */
export function LegalDocument({ document }: LegalDocumentProps) {
	return (
		<article className="shell-prose">
			<p className="mb-3 font-bold font-sans text-brand-bright text-xs uppercase tracking-[0.2em]">
				Documento legal
			</p>
			<h1 className="font-display font-extrabold text-[2.5rem] text-ink uppercase leading-[1.02] sm:text-[2.875rem]">
				{document.title}
			</h1>
			<p className="mt-3.5 font-sans text-ink-faint text-sm">
				Última atualização: {document.updatedAt}
			</p>

			<div className="mt-9 flex flex-col gap-7.5">
				{document.sections.map((section, index) => (
					<section key={section.heading ?? `intro-${index}`}>
						{section.heading ? (
							<h2 className="mb-3 font-bold font-sans text-[0.9375rem] text-brand uppercase tracking-[0.11em]">
								{section.heading}
							</h2>
						) : null}

						{section.paragraphs?.map((paragraph) => (
							<p
								key={paragraph.slice(0, 48)}
								className="text-pretty font-sans text-base text-ink-soft leading-[1.7]"
							>
								{paragraph}
							</p>
						))}

						{section.cards ? (
							<ul className="flex flex-col gap-3">
								{section.cards.map((card) => (
									<li
										key={card.title}
										className="rounded-lg border border-brand/12 bg-cream-raised px-4.5 py-4"
									>
										<h3 className="font-bold font-sans text-ink text-sm">
											{card.title}
										</h3>
										<p className="mt-1.5 font-sans text-[0.9375rem] text-ink-muted leading-relaxed">
											{card.text}
										</p>
									</li>
								))}
							</ul>
						) : null}
					</section>
				))}
			</div>
		</article>
	);
}
