import { cn } from "@my-better-t-app/ui/lib/utils";
import { useId } from "react";

interface FilterChipsProps<TValue extends string> {
	options: readonly { readonly value: TValue; readonly label: string }[];
	value: TValue;
	onChange: (value: TValue) => void;
	/** Accessible name for the group, e.g. "Filtrar receitas". */
	label: string;
	className?: string;
}

/**
 * Pill-shaped single-select filter row.
 *
 * Built on real radio inputs — visually hidden, styled through their labels —
 * so keyboard users get native arrow-key navigation and screen readers
 * announce the single-choice semantics the visual design implies.
 */
export function FilterChips<TValue extends string>({
	options,
	value,
	onChange,
	label,
	className,
}: FilterChipsProps<TValue>) {
	const name = useId();

	return (
		<fieldset className={cn("border-0 p-0", className)}>
			<legend className="sr-only">{label}</legend>
			<div className="flex flex-wrap justify-center gap-2.5">
				{options.map((option) => {
					const active = option.value === value;
					return (
						<label
							key={option.value}
							className={cn(
								"cursor-pointer rounded-full border border-brand/28 px-4.5 py-2 font-sans font-semibold text-[0.8125rem] transition-colors has-focus-visible:outline-2 has-focus-visible:outline-brand-bright has-focus-visible:outline-offset-2",
								active
									? "bg-brand text-cream-fg"
									: "bg-transparent text-[#6b564c] hover:bg-brand/8",
							)}
						>
							<input
								type="radio"
								name={name}
								value={option.value}
								checked={active}
								onChange={() => onChange(option.value)}
								className="sr-only"
							/>
							{option.label}
						</label>
					);
				})}
			</div>
		</fieldset>
	);
}
