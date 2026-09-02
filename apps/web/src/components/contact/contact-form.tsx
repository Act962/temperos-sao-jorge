import { cn } from "@my-better-t-app/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { type ReactNode, useId, useState } from "react";
import { toast } from "sonner";
import { CONTACT_SUBJECTS } from "@/data/site";

const FIELD_CLASS =
	"rounded-[4px] border border-brand/22 bg-cream-raised px-3.5 py-3 font-sans text-[0.9375rem] text-ink outline-none placeholder:text-ink-faint focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20";

interface FieldProps {
	label: string;
	htmlFor: string;
	children: ReactNode;
	className?: string;
}

function Field({ label, htmlFor, children, className }: FieldProps) {
	return (
		<div className={cn("flex flex-col gap-1.5", className)}>
			<label
				htmlFor={htmlFor}
				className="font-sans font-semibold text-[0.8125rem] text-ink-soft"
			>
				{label}
			</label>
			{children}
		</div>
	);
}

/**
 * Consumer contact form.
 *
 * Field validation runs natively in the browser. Submission is not wired to a
 * backend yet — point `handleSubmit` at the real endpoint before launch.
 */
export function ContactForm() {
	const ids = {
		name: useId(),
		email: useId(),
		phone: useId(),
		reason: useId(),
		subject: useId(),
		message: useId(),
	};
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (submitting) return;

		setSubmitting(true);
		// TODO: send the payload to the real contact endpoint.
		toast.success("Mensagem enviada. Nossa equipe responde em breve.");
		event.currentTarget.reset();
		setSubmitting(false);
	};

	return (
		<form onSubmit={handleSubmit} className="grid gap-4.5 sm:grid-cols-2">
			<Field label="Nome completo" htmlFor={ids.name} className="sm:col-span-2">
				<input
					id={ids.name}
					name="name"
					type="text"
					required
					autoComplete="name"
					placeholder="Seu nome"
					className={FIELD_CLASS}
				/>
			</Field>

			<Field label="E-mail" htmlFor={ids.email}>
				<input
					id={ids.email}
					name="email"
					type="email"
					required
					autoComplete="email"
					placeholder="voce@email.com"
					className={FIELD_CLASS}
				/>
			</Field>

			<Field label="Telefone" htmlFor={ids.phone}>
				<input
					id={ids.phone}
					name="phone"
					type="tel"
					autoComplete="tel"
					placeholder="(00) 00000-0000"
					className={FIELD_CLASS}
				/>
			</Field>

			<Field label="Motivo do contato" htmlFor={ids.reason}>
				<select
					id={ids.reason}
					name="reason"
					required
					defaultValue=""
					className={FIELD_CLASS}
				>
					<option value="" disabled>
						Selecione
					</option>
					{CONTACT_SUBJECTS.map((subject) => (
						<option key={subject} value={subject}>
							{subject}
						</option>
					))}
				</select>
			</Field>

			<Field label="Assunto" htmlFor={ids.subject}>
				<input
					id={ids.subject}
					name="subject"
					type="text"
					required
					placeholder="Assunto"
					className={FIELD_CLASS}
				/>
			</Field>

			<Field label="Mensagem" htmlFor={ids.message} className="sm:col-span-2">
				<textarea
					id={ids.message}
					name="message"
					rows={5}
					required
					placeholder="Escreva sua mensagem"
					className={cn(FIELD_CLASS, "resize-y")}
				/>
			</Field>

			<p className="font-sans text-ink-faint text-xs leading-relaxed sm:col-span-2">
				Ao enviar, você concorda com o tratamento dos seus dados conforme a
				nossa{" "}
				<Link to="/privacidade" className="text-brand underline">
					Política de Privacidade
				</Link>
				.
			</p>

			<button
				type="submit"
				disabled={submitting}
				className="w-full justify-self-start rounded-[4px] bg-brand px-7 py-3.5 font-sans font-semibold text-[0.9375rem] text-white transition-colors hover:bg-brand-hover disabled:opacity-60 sm:col-span-2 sm:w-auto"
			>
				Enviar mensagem
			</button>
		</form>
	);
}
