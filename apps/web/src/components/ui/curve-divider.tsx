import { cn } from "@my-better-t-app/ui/lib/utils";

interface CurveDividerProps {
	/** Fill colour of the incoming section. */
	fill: string;
	/** Which of the two hand-drawn curves from the design to draw. */
	variant?: "cream" | "brand";
	className?: string;
}

const PATHS = {
	cream: {
		viewBox: "0 0 1440 88",
		d: "M0,30 C220,4 520,0 900,30 C1150,50 1320,68 1440,76 L1440,88 L0,88 Z",
		height: "h-[88px]",
		offset: "-top-[86px]",
	},
	brand: {
		viewBox: "0 0 1440 106",
		d: "M0,8 C210,-6 470,44 860,74 C1090,92 1300,101 1440,104 L1440,106 L0,106 Z",
		height: "h-[106px]",
		offset: "-top-[104px]",
	},
} as const;

/**
 * The soft wave that joins two full-bleed sections. Purely decorative, so it is
 * hidden from assistive technology and never intercepts pointer events.
 */
export function CurveDivider({
	fill,
	variant = "cream",
	className,
}: CurveDividerProps) {
	const path = PATHS[variant];

	return (
		<div
			aria-hidden="true"
			className={cn(
				"pointer-events-none absolute right-0 left-0 leading-[0]",
				path.offset,
				path.height,
				className,
			)}
		>
			<svg
				aria-hidden="true"
				viewBox={path.viewBox}
				preserveAspectRatio="none"
				className="block h-full w-full"
				focusable="false"
			>
				<path d={path.d} fill={fill} />
			</svg>
		</div>
	);
}
