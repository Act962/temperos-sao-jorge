import { cn } from "@my-better-t-app/ui/lib/utils";
import { type ReactNode, useEffect, useRef, useState } from "react";

interface RevealProps {
	children: ReactNode;
	/** Stagger in milliseconds, applied as a transition delay. */
	delay?: number;
	className?: string;
	as?: "div" | "section" | "li" | "article";
}

/**
 * Fades and lifts its children into place the first time they scroll into view.
 *
 * Renders visible-by-default so server-rendered markup is never hidden from
 * crawlers or from readers with JavaScript disabled; the hidden state is only
 * applied on the client, and never when the user asked for reduced motion.
 */
export function Reveal({
	children,
	delay = 0,
	className,
	as: Tag = "div",
}: RevealProps) {
	const ref = useRef<HTMLElement | null>(null);
	const [shown, setShown] = useState(true);

	useEffect(() => {
		const node = ref.current;
		if (!node) return;

		const prefersReducedMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		if (prefersReducedMotion) return;

		setShown(false);

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						setShown(true);
						observer.disconnect();
					}
				}
			},
			{ rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
		);

		observer.observe(node);
		return () => observer.disconnect();
	}, []);

	return (
		<Tag
			ref={ref as never}
			style={{ transitionDelay: `${delay}ms` }}
			className={cn(
				"transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,0.7,0.24,1)] motion-reduce:transition-none",
				shown ? "translate-y-0 opacity-100" : "translate-y-7 opacity-0",
				className,
			)}
		>
			{children}
		</Tag>
	);
}
