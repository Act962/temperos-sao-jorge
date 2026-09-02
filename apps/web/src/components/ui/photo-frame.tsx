import { cn } from "@my-better-t-app/ui/lib/utils";
import { useImageFallback } from "@/hooks/use-image-fallback";

interface PhotoFrameProps {
	src?: string;
	alt: string;
	/** Shown inside the placeholder while the real photo is not available yet. */
	hint?: string;
	className?: string;
	imageClassName?: string;
	loading?: "lazy" | "eager";
	fetchPriority?: "high" | "low" | "auto";
	sizes?: string;
}

/**
 * Editorial photo slot.
 *
 * The design canvas left these as fillable placeholders, so the frame keeps the
 * layout honest whether or not the final photograph has landed: it renders the
 * image when there is one, and a labelled brand-coloured plate when there is
 * not (or when the file fails to load).
 */
export function PhotoFrame({
	src,
	alt,
	hint,
	className,
	imageClassName,
	loading = "lazy",
	fetchPriority,
	sizes,
}: PhotoFrameProps) {
	const { failed, imageProps } = useImageFallback();
	const showPlaceholder = !src || failed;

	return (
		<div
			className={cn(
				"relative h-full w-full overflow-hidden bg-cream-sunken",
				className,
			)}
		>
			{showPlaceholder ? (
				<div className="flex h-full w-full items-center justify-center bg-[repeating-linear-gradient(135deg,var(--color-cream-sunken)_0px,var(--color-cream-sunken)_14px,var(--color-cream-raised)_14px,var(--color-cream-raised)_28px)] p-4">
					<span className="max-w-[22ch] text-center font-sans text-ink-faint text-xs leading-snug">
						{hint ?? alt}
					</span>
				</div>
			) : (
				<img
					src={src}
					alt={alt}
					loading={loading}
					fetchPriority={fetchPriority}
					decoding="async"
					sizes={sizes}
					className={cn("h-full w-full object-cover", imageClassName)}
					{...imageProps}
				/>
			)}
		</div>
	);
}
