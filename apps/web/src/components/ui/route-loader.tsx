import { Loader2 } from "lucide-react";

/** Pending state shown while a route resolves. */
export function RouteLoader() {
	return (
		<div className="flex min-h-75 items-center justify-center py-16">
			<Loader2 aria-hidden="true" className="size-6 animate-spin text-brand" />
			<span className="sr-only">Carregando</span>
		</div>
	);
}
