import { cn } from "@my-better-t-app/ui/lib/utils";
import { useImageFallback } from "@/hooks/use-image-fallback";

interface ProductImageProps {
	src: string;
	alt: string;
	className?: string;
	/** Product shots below the fold should stay lazy; the first row can be eager. */
	loading?: "lazy" | "eager";
}

/**
 * Packshot renderer.
 *
 * Packshots are square 600px WebP files with a transparent background,
 * produced by `scripts/optimize-product-images.mjs`. Intrinsic dimensions are
 * declared so the grid reserves space and never shifts layout while loading;
 * a missing file degrades to a quiet branded tile, not a broken-image icon.
 */
export function ProductImage({
	src,
	alt,
	className,
	loading = "lazy",
}: ProductImageProps) {
	const { failed, imageProps } = useImageFallback();

	if (failed) {
		return (
			<div
				className={cn(
					"flex h-full w-full items-center justify-center rounded-[4px] border border-brand/20 border-dashed bg-cream-sunken/60 p-3",
					className,
				)}
			>
				<span className="text-center font-sans text-[0.6875rem] text-ink-faint leading-tight">
					{alt}
				</span>
			</div>
		);
	}

	return (
		<img
			src={src}
			alt={alt}
			loading={loading}
			decoding="async"
			width={600}
			height={600}
			className={cn("h-full w-full object-contain", className)}
			{...imageProps}
		/>
	);
}
