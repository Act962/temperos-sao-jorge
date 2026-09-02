import { Button } from "@my-better-t-app/ui/components/button";
import { Input } from "@my-better-t-app/ui/components/input";
import { Label } from "@my-better-t-app/ui/components/label";
import { Plus, X } from "lucide-react";
import { useId, useState } from "react";

interface Opcao {
	slug: string;
	name: string;
}

interface ProductPickerProps {
	catalogo: readonly Opcao[];
	selecionados: readonly string[];
	aoMudar: (slugs: string[]) => void;
}

const LIMITE = 8;

/**
 * Escolha dos produtos citados, por busca.
 *
 * São 105 no catálogo: um `<select multiple>` com essa lista é inutilizável.
 * O autor digita parte do nome e escolhe entre os que casam; os escolhidos
 * viram fichas removíveis, para a lista final caber num relance.
 */
export function ProductPicker({
	catalogo,
	selecionados,
	aoMudar,
}: ProductPickerProps) {
	const idBusca = useId();
	const [busca, setBusca] = useState("");

	const porSlug = new Map(catalogo.map((item) => [item.slug, item]));
	const termo = busca.trim().toLowerCase();

	const resultados =
		termo === ""
			? []
			: catalogo
					.filter(
						(item) =>
							!selecionados.includes(item.slug) &&
							item.name.toLowerCase().includes(termo),
					)
					.slice(0, LIMITE);

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-col gap-1.5">
				<Label htmlFor={idBusca}>Produtos citados</Label>
				<Input
					id={idBusca}
					value={busca}
					onChange={(evento) => setBusca(evento.target.value)}
					placeholder="Busque pelo nome do produto"
				/>
			</div>

			{termo !== "" ? (
				resultados.length > 0 ? (
					<ul className="flex flex-col gap-1 rounded-md border border-brand/12 bg-cream-raised p-1.5">
						{resultados.map((item) => (
							<li key={item.slug}>
								<button
									type="button"
									className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left font-sans text-ink text-sm transition-colors hover:bg-brand/8 hover:text-brand"
									onClick={() => {
										aoMudar([...selecionados, item.slug]);
										setBusca("");
									}}
								>
									<Plus aria-hidden="true" className="size-3.5 shrink-0" />
									{item.name}
								</button>
							</li>
						))}
					</ul>
				) : (
					<p className="font-sans text-ink-faint text-sm">
						Nenhum produto com "{busca.trim()}" no nome.
					</p>
				)
			) : null}

			{selecionados.length > 0 ? (
				<ul className="flex flex-wrap gap-2">
					{selecionados.map((slug) => (
						<li key={slug}>
							<span className="flex items-center gap-1 rounded-full bg-brand/8 py-1 pr-1 pl-3 font-sans text-ink text-sm">
								{/* Um slug sem produto no catálogo aparece como está: a
								    receita ainda cita algo que sumiu, e esconder isso só
								    adiaria a descoberta. */}
								{porSlug.get(slug)?.name ?? slug}
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									aria-label={`Remover ${porSlug.get(slug)?.name ?? slug}`}
									onClick={() =>
										aoMudar(selecionados.filter((item) => item !== slug))
									}
								>
									<X aria-hidden="true" />
								</Button>
							</span>
						</li>
					))}
				</ul>
			) : (
				<p className="font-sans text-ink-faint text-sm">
					Nenhum produto citado ainda.
				</p>
			)}
		</div>
	);
}
