import { TIMELINE } from "@/data/timeline";

/** Horizontal milestone rail on the "Sobre nós" page. */
export function AboutTimeline() {
	return (
		<ol className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5">
			{TIMELINE.map((entry) => (
				<li
					key={entry.year}
					className="relative border-brand/20 border-t-2 pt-5.5"
				>
					<span
						aria-hidden="true"
						className="absolute -top-1.5 left-0 size-3 rounded-full bg-brand"
					/>
					<p className="font-bold font-display text-base text-brand tracking-[0.06em]">
						{entry.year}
					</p>
					<h3 className="mt-2.5 font-sans font-semibold text-ink text-xs leading-snug">
						{entry.title}
					</h3>
					<p className="mt-1.5 font-sans text-[#7a6a60] text-xs leading-relaxed">
						{entry.text}
					</p>
				</li>
			))}
		</ol>
	);
}
