import { BrandLink } from "@/components/ui/brand-button";
import { CurveDivider } from "@/components/ui/curve-divider";
import { PhotoFrame } from "@/components/ui/photo-frame";
import { Reveal } from "@/components/ui/reveal";
import { Eyebrow, SectionHeading } from "@/components/ui/section-heading";

/** "Nossa história" teaser, with the arched archive photo and handwritten note. */
export function StorySection() {
	return (
		<section className="relative mt-[-2px] bg-cream pt-26 pb-32">
			<CurveDivider fill="var(--color-cream)" variant="cream" />

			<div className="shell grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-20">
				<Reveal className="relative pb-26">
					<div className="h-[466px] overflow-hidden rounded-[48%_56px_16px_48%/50%_56px_16px_50%] shadow-[0_14px_34px_rgba(43,33,28,0.14)] [filter:grayscale(1)_sepia(0.24)_contrast(1.04)]">
						<PhotoFrame
							src="/images/historia.jpg"
							alt="Fachada e caminhão antigo da São Jorge Alimentos"
							hint="Foto histórica: fachada e caminhão antigo"
						/>
					</div>

					<div className="absolute bottom-0 left-0 flex items-end gap-1">
						<p className="w-42 shrink-0 -rotate-3 font-script text-ink-muted text-xl leading-snug">
							Tudo começou com trabalho, família e propósito.
						</p>
						<svg
							viewBox="0 0 70 76"
							aria-hidden="true"
							focusable="false"
							className="mb-5.5 ml-0.5 h-16.5 w-15 text-[#6b584d]"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.6"
						>
							<path d="M4 72C2 44 14 18 44 6" strokeLinecap="round" />
							<path
								d="M31 2l14 3-3 14"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</div>
				</Reveal>

				<Reveal delay={120}>
					<Eyebrow className="mb-4">Nossa história</Eyebrow>
					<SectionHeading className="text-[2.875rem]">
						Uma história que começa na família
					</SectionHeading>
					<p className="mt-6 max-w-[27.5rem] text-pretty font-sans text-base text-ink-muted leading-[1.7]">
						Fundada com o propósito de oferecer alimentos de qualidade, a São
						Jorge Alimentos nasceu de um sonho familiar e hoje está presente na
						mesa de milhares de pessoas em todo o Brasil.
					</p>
					<BrandLink to="/sobre" variant="outline" className="mt-7.5">
						Conheça nossa história
					</BrandLink>
				</Reveal>
			</div>
		</section>
	);
}
