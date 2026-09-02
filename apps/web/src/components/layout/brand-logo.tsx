import { cn } from "@my-better-t-app/ui/lib/utils";
import { SITE } from "@/data/site";
import { useImageFallback } from "@/hooks/use-image-fallback";

interface BrandLogoProps {
	className?: string;
	/** Wordmark colour used when the logo file is unavailable. */
	tone?: "brand" | "cream";
	loading?: "lazy" | "eager";
}

/**
 * The São Jorge mark, with a typographic wordmark as a fallback so the header
 * and footer never collapse if the logo asset is missing.
 */
export function BrandLogo({
	className,
	tone = "brand",
	loading = "eager",
}: BrandLogoProps) {
	const { failed, imageProps } = useImageFallback();

	if (failed) {
		return (
			<span
				className={cn(
					"font-display font-extrabold text-[1.375rem] uppercase leading-none tracking-wide",
					tone === "cream" ? "text-cream-fg" : "text-brand",
					className,
				)}
			>
				São Jorge
				<span className="block font-semibold text-[0.625rem] tracking-[0.3em] opacity-80">
					Alimentos
				</span>
			</span>
		);
	}

	return (
		<img
			src={SITE.logo}
			alt={SITE.name}
			loading={loading}
			decoding="async"
			className={cn("block w-auto", className)}
			{...imageProps}
		/>
	);
}
