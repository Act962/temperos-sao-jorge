import { Button } from "@my-better-t-app/ui/components/button";
import { Input } from "@my-better-t-app/ui/components/input";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { useId } from "react";

interface OrderedListFieldProps {
	rotulo: string;
	/** Aparece abaixo do título, explicando o que entra em cada linha. */
	ajuda?: string;
	itens: readonly string[];
	aoMudar: (itens: string[]) => void;
	placeholder: string;
	textoAdicionar: string;
}

/**
 * Lista ordenada editável — uma linha por item.
 *
 * Sem arrastar e soltar: exigiria biblioteca e precisão de ponteiro, e some
 * para quem usa teclado ou leitor de tela. Subir e descer dão conta de uma
 * lista de dez itens. Também não é um campo de texto com um item por linha:
 * é rápido de escrever e péssimo de revisar, porque um `Enter` a mais divide
 * um ingrediente em dois sem ninguém perceber.
 */
export function OrderedListField({
	rotulo,
	ajuda,
	itens,
	aoMudar,
	placeholder,
	textoAdicionar,
}: OrderedListFieldProps) {
	const idAjuda = useId();

	const trocar = (de: number, para: number) => {
		if (para < 0 || para >= itens.length) return;
		const copia = [...itens];
		[copia[de], copia[para]] = [copia[para], copia[de]];
		aoMudar(copia);
	};

	return (
		<fieldset className="flex flex-col gap-2">
			<legend className="font-sans font-semibold text-ink text-sm">
				{rotulo}
			</legend>
			{ajuda ? (
				<p id={idAjuda} className="font-sans text-ink-faint text-xs">
					{ajuda}
				</p>
			) : null}

			<ol className="flex flex-col gap-2">
				{itens.map((item, indice) => (
					// A posição é a identidade aqui: dois ingredientes podem ter o
					// mesmo texto, e o campo em branco recém-criado não tem nenhum.
					<li key={indice} className="flex items-center gap-1.5">
						<span className="w-5 shrink-0 text-right font-sans text-ink-faint text-xs tabular-nums">
							{indice + 1}
						</span>
						<Input
							value={item}
							aria-label={`${rotulo}, item ${indice + 1}`}
							aria-describedby={ajuda ? idAjuda : undefined}
							placeholder={placeholder}
							onChange={(evento) => {
								const copia = [...itens];
								copia[indice] = evento.target.value;
								aoMudar(copia);
							}}
						/>
						<div className="flex shrink-0">
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								aria-label={`Subir item ${indice + 1}`}
								disabled={indice === 0}
								onClick={() => trocar(indice, indice - 1)}
							>
								<ArrowUp aria-hidden="true" />
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								aria-label={`Descer item ${indice + 1}`}
								disabled={indice === itens.length - 1}
								onClick={() => trocar(indice, indice + 1)}
							>
								<ArrowDown aria-hidden="true" />
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								aria-label={`Remover item ${indice + 1}`}
								onClick={() => aoMudar(itens.filter((_, i) => i !== indice))}
							>
								<X aria-hidden="true" />
							</Button>
						</div>
					</li>
				))}
			</ol>

			<div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => aoMudar([...itens, ""])}
				>
					<Plus aria-hidden="true" />
					{textoAdicionar}
				</Button>
			</div>
		</fieldset>
	);
}
