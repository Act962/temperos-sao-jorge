import { cn } from "@my-better-t-app/ui/lib/utils";
import { Link, type LinkComponentProps } from "@tanstack/react-router";
import type { ButtonHTMLAttributes } from "react";

/**
 * The three button treatments the design uses: a solid brand button, an
 * outlined one for secondary actions, and a light one for use on red surfaces.
 */
export type BrandButtonVariant = "solid" | "outline" | "light";
export type BrandButtonSize = "sm" | "md" | "lg";

const BASE =
	"inline-flex items-center justify-center gap-2 rounded-[4px] font-sans font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-bright disabled:pointer-events-none disabled:opacity-60";

const VARIANTS: Record<BrandButtonVariant, string> = {
	solid: "bg-brand text-white hover:bg-brand-hover",
	outline:
		"border-[1.5px] border-brand bg-transparent text-brand hover:bg-brand hover:text-white",
	light: "bg-cream-fg text-brand hover:bg-white",
};

const SIZES: Record<BrandButtonSize, string> = {
	sm: "px-[18px] py-2.5 text-[0.8125rem]",
	md: "px-[22px] py-3 text-sm",
	lg: "px-7 py-[15px] text-[0.9375rem]",
};

export function brandButtonClass(
	variant: BrandButtonVariant = "solid",
	size: BrandButtonSize = "md",
	className?: string,
): string {
	return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

interface BrandVariantProps {
	variant?: BrandButtonVariant;
	size?: BrandButtonSize;
}

export type BrandButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
	BrandVariantProps;

export function BrandButton({
	className,
	variant,
	size,
	type = "button",
	...props
}: BrandButtonProps) {
	return (
		<button
			type={type}
			className={brandButtonClass(variant, size, className)}
			{...props}
		/>
	);
}

export type BrandLinkProps = LinkComponentProps<"a"> & BrandVariantProps;

/** Same treatment as `BrandButton`, but navigates via the router. */
export function BrandLink({
	className,
	variant,
	size,
	...props
}: BrandLinkProps) {
	return (
		<Link className={brandButtonClass(variant, size, className)} {...props} />
	);
}
