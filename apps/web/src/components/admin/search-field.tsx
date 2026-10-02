import { Input } from "@my-better-t-app/ui/components/input";
import { Search } from "lucide-react";

interface SearchFieldProps {
	/** Nome acessível do campo: "Buscar produto". */
	rotulo: string;
	valor: string;
	aoMudar: (valor: string) => void;
	placeholder?: string;
}

/** Campo de busca das listagens. O valor mora na URL, não aqui. */
export function SearchField({
	rotulo,
	valor,
	aoMudar,
	placeholder,
}: SearchFieldProps) {
	return (
		<div className="relative">
			<Search
				aria-hidden="true"
				className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint"
			/>
			<Input
				type="search"
				aria-label={rotulo}
				value={valor}
				placeholder={placeholder}
				onChange={(evento) => aoMudar(evento.target.value)}
				className="pl-9"
			/>
		</div>
	);
}
