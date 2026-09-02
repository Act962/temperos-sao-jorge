import type { ReactNode } from "react";
import { CONTACT } from "@/data/site";

interface InfoBlockProps {
	title: string;
	children: ReactNode;
}

function InfoBlock({ title, children }: InfoBlockProps) {
	return (
		<div>
			<h2 className="mb-2.5 font-bold font-sans text-brand-bright text-xs uppercase tracking-[0.16em]">
				{title}
			</h2>
			<div className="font-sans text-[0.9375rem] text-ink-soft leading-[1.7]">
				{children}
			</div>
		</div>
	);
}

/** Phone, address and opening hours column on the contact page. */
export function ContactInfo() {
	return (
		<div className="flex flex-col gap-7.5">
			<InfoBlock title="Fale conosco">
				<p>
					<a
						href={`tel:${CONTACT.phoneE164}`}
						className="transition-colors hover:text-brand"
					>
						{CONTACT.phone}
					</a>
				</p>
				<p>
					<a
						href={`mailto:${CONTACT.email}`}
						className="transition-colors hover:text-brand"
					>
						{CONTACT.email}
					</a>
				</p>
			</InfoBlock>

			<InfoBlock title="Endereço">
				<address className="not-italic">
					{CONTACT.street}
					<br />
					{CONTACT.district}
					<br />
					{CONTACT.city} — {CONTACT.state}
					<br />
					CEP {CONTACT.postalCode}
				</address>
			</InfoBlock>

			<InfoBlock title="Horário de atendimento">
				<p>{CONTACT.openingHours}</p>
			</InfoBlock>
		</div>
	);
}
