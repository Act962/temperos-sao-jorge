import { useId, useState } from "react";
import { toast } from "sonner";

/**
 * Footer newsletter capture.
 *
 * The design canvas left this form inert. Validation and the success state are
 * implemented here; wire `onSubmit` to a real subscription endpoint before
 * launch — nothing is persisted today.
 */
export function NewsletterForm() {
	const inputId = useId();
	const [email, setEmail] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (submitting) return;

		setSubmitting(true);
		// TODO: replace with the real newsletter subscription call.
		toast.success(
			"Recebemos seu e-mail. Em breve você recebe nossas novidades.",
		);
		setEmail("");
		setSubmitting(false);
	};

	return (
		<form onSubmit={handleSubmit} className="mt-4 flex w-full max-w-100">
			<label htmlFor={inputId} className="sr-only">
				Seu melhor e-mail
			</label>
			<input
				id={inputId}
				type="email"
				name="email"
				required
				autoComplete="email"
				placeholder="Seu melhor e-mail"
				value={email}
				onChange={(event) => setEmail(event.target.value)}
				className="min-w-0 flex-1 rounded-l-[3px] bg-cream-raised px-3.5 py-3 font-sans text-ink text-sm outline-none placeholder:text-ink-faint focus-visible:ring-2 focus-visible:ring-cream-fg focus-visible:ring-inset"
			/>
			<button
				type="submit"
				disabled={submitting}
				className="rounded-r-[3px] bg-brand-deep px-[22px] py-3 font-sans font-semibold text-cream-fg text-sm transition-colors hover:bg-brand-deeper disabled:opacity-60"
			>
				Enviar
			</button>
		</form>
	);
}
