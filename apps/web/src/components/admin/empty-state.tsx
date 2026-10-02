import type { ReactNode } from "react";

interface EmptyStateProps {
	titulo: string;
	children?: ReactNode;
}

/** O que a listagem mostra quando não há nada — ou nada que case com a busca. */
export function EmptyState({ titulo, children }: EmptyStateProps) {
	return (
		<div className="rounded-lg border border-brand/25 border-dashed px-5 py-10 text-center font-sans">
			<p className="font-semibold text-ink">{titulo}</p>
			{children ? (
				<div className="mt-1.5 text-ink-muted text-sm">{children}</div>
			) : null}
		</div>
	);
}
