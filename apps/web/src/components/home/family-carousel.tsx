import { cn } from "@my-better-t-app/ui/lib/utils";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FamilyCard } from "@/components/home/family-card";
import type { FeaturedFamily } from "@/data/home";

interface FamilyCarouselProps {
	families: readonly FeaturedFamily[];
}

/** Quantos cartões ficam visíveis no maior breakpoint — só para o `loading`. */
const EAGER_SLIDES = 4;

/**
 * Carrossel das famílias de produtos.
 *
 * Todos os cartões são renderizados no servidor, então os oito links continuam
 * no HTML mesmo antes da hidratação — o carrossel muda a apresentação, não o
 * conteúdo indexável.
 */
export function FamilyCarousel({ families }: FamilyCarouselProps) {
	const [emblaRef, emblaApi] = useEmblaCarousel({
		align: "start",
		// Sem espaço vazio no fim: o último snap para no último cartão.
		containScroll: "trimSnaps",
		loop: false,
	});

	const [canScrollPrev, setCanScrollPrev] = useState(false);
	const [canScrollNext, setCanScrollNext] = useState(false);

	const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
	const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

	useEffect(() => {
		if (!emblaApi) return;

		const sync = () => {
			setCanScrollPrev(emblaApi.canScrollPrev());
			setCanScrollNext(emblaApi.canScrollNext());
		};

		sync();
		emblaApi.on("select", sync).on("reInit", sync);

		return () => {
			emblaApi.off("select", sync).off("reInit", sync);
		};
	}, [emblaApi]);

	// Quem pediu menos movimento recebe o salto direto, sem a animação de rolagem.
	useEffect(() => {
		if (!emblaApi) return;
		const query = window.matchMedia("(prefers-reduced-motion: reduce)");
		const apply = () => emblaApi.reInit({ duration: query.matches ? 0 : 25 });

		apply();
		query.addEventListener("change", apply);
		return () => query.removeEventListener("change", apply);
	}, [emblaApi]);

	return (
		<div className="relative">
			<div className="overflow-hidden" ref={emblaRef}>
				<ul className="-ml-5.5 flex touch-pan-y">
					{families.map((family, index) => (
						<li
							key={family.slug}
							className="min-w-0 shrink-0 grow-0 basis-[78%] pl-5.5 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
						>
							<FamilyCard family={family} eager={index < EAGER_SLIDES} />
						</li>
					))}
				</ul>
			</div>

			<div className="mt-7 flex justify-end gap-2.5">
				<CarouselButton
					label="Famílias anteriores"
					onClick={scrollPrev}
					disabled={!canScrollPrev}
				>
					<ChevronLeft aria-hidden="true" className="size-5" />
				</CarouselButton>
				<CarouselButton
					label="Próximas famílias"
					onClick={scrollNext}
					disabled={!canScrollNext}
				>
					<ChevronRight aria-hidden="true" className="size-5" />
				</CarouselButton>
			</div>
		</div>
	);
}

interface CarouselButtonProps {
	label: string;
	onClick: () => void;
	disabled: boolean;
	children: React.ReactNode;
}

function CarouselButton({
	label,
	onClick,
	disabled,
	children,
}: CarouselButtonProps) {
	return (
		<button
			type="button"
			aria-label={label}
			onClick={onClick}
			disabled={disabled}
			className={cn(
				"inline-flex size-11 items-center justify-center rounded-full border border-cream-fg/35 text-cream-fg transition-colors",
				"hover:border-cream-fg hover:bg-cream-fg hover:text-brand",
				"focus-visible:outline-2 focus-visible:outline-cream-fg focus-visible:outline-offset-2",
				"disabled:pointer-events-none disabled:opacity-35",
			)}
		>
			{children}
		</button>
	);
}
