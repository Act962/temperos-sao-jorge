import type { ReactNode } from "react";

interface PageHeadingProps {
	title: string;
	description?: string;
	action?: ReactNode;
}

/** Cabeçalho padrão das telas do painel. */
export function PageHeading({ title, description, action }: PageHeadingProps) {
	return (
		<header className="mb-8 flex flex-wrap items-start justify-between gap-4">
			<div>
				<h1 className="font-display font-extrabold text-[1.75rem] text-ink uppercase leading-none">
					{title}
				</h1>
				{description ? (
					<p className="mt-2 font-sans text-ink-muted text-sm">{description}</p>
				) : null}
			</div>
			{action}
		</header>
	);
}
