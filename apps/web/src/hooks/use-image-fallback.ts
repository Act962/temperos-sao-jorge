import { type RefCallback, useCallback, useState } from "react";

interface ImageFallback {
	/** True once the image is known to be unavailable. */
	failed: boolean;
	/** Spread onto the `<img>`: attaches the ref and the error handler. */
	imageProps: {
		ref: RefCallback<HTMLImageElement>;
		onError: () => void;
	};
}

/**
 * Tracks whether an image failed to load, including the server-rendered case.
 *
 * A plain `onError` handler is not enough: the browser can finish (and fail) a
 * server-rendered image before React hydrates, so that event is never
 * delivered. The ref callback re-checks the element on attach — a complete
 * image with zero intrinsic width is a broken one.
 */
export function useImageFallback(): ImageFallback {
	const [failed, setFailed] = useState(false);

	const ref = useCallback<RefCallback<HTMLImageElement>>((node) => {
		if (node?.complete && node.naturalWidth === 0) setFailed(true);
	}, []);

	const onError = useCallback(() => setFailed(true), []);

	return { failed, imageProps: { ref, onError } };
}
