import { cn } from "@my-better-t-app/ui/lib/utils";
import type { ReactNode } from "react";

interface PageHeaderProps {
	title: string;
	description?: ReactNode;
	className?: string;
}

/** Centred page title block shared by the interior pages. */
export function PageHeader({ title, description, className }: PageHeaderProps) {
	return (
		<header className={cn("text-center", className)}>
			<h1 className="font-display font-extrabold text-[2.5rem] text-ink uppercase leading-none sm:text-[3rem]">
				{title}
			</h1>
			{description ? (
				<p className="mx-auto mt-3.5 max-w-lg font-sans text-base text-ink-muted leading-relaxed sm:text-[1.0625rem]">
					{description}
				</p>
			) : null}
		</header>
	);
}
