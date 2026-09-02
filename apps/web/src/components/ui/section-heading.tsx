import { cn } from "@my-better-t-app/ui/lib/utils";
import type { ReactNode } from "react";

interface EyebrowProps {
	children: ReactNode;
	className?: string;
}

/** Small uppercase kicker that sits above a section title. */
export function Eyebrow({ children, className }: EyebrowProps) {
	return (
		<p
			className={cn(
				"font-bold font-sans text-[0.75rem] text-brand-bright uppercase tracking-[0.15em]",
				className,
			)}
		>
			{children}
		</p>
	);
}

interface SectionHeadingProps {
	children: ReactNode;
	/** Renders the trailing accent period in the brand colour. */
	accent?: boolean;
	className?: string;
	accentClassName?: string;
	as?: "h1" | "h2" | "h3";
}

/** Condensed uppercase display heading used across every section. */
export function SectionHeading({
	children,
	accent = true,
	className,
	accentClassName,
	as: Tag = "h2",
}: SectionHeadingProps) {
	return (
		<Tag
			className={cn(
				"font-display font-extrabold text-[2.5rem] text-ink uppercase leading-[1.05] sm:text-[2.75rem]",
				className,
			)}
		>
			{children}
			{accent ? (
				<span className={cn("text-brand-bright", accentClassName)}>.</span>
			) : null}
		</Tag>
	);
}
