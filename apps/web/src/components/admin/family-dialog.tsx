import { Button } from "@my-better-t-app/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@my-better-t-app/ui/components/dialog";
import { Input } from "@my-better-t-app/ui/components/input";
import { Label } from "@my-better-t-app/ui/components/label";
import { useId } from "react";

interface FamilyDialogProps {
	aberto: boolean;
	aoFechar: () => void;
	/** Ausente ao criar; presente ao renomear. */
	inicial?: { slug: string; name: string };
	enviando: boolean;
	erro: string | null;
	aoSalvar: (nome: string) => void;
}

/**
 * Formulário de família: só o nome.
 *
 * O endereço `/produtos/<familia>` é derivado do nome na criação e não muda
 * depois — é a URL publicada e a pasta das fotos dos produtos.
 */
export function FamilyDialog({
	aberto,
	aoFechar,
	inicial,
	enviando,
	erro,
	aoSalvar,
}: FamilyDialogProps) {
	const idNome = useId();
	const editando = inicial !== undefined;

	return (
		<Dialog open={aberto} onOpenChange={(estado) => !estado && aoFechar()}>
			<DialogContent className="p-5 sm:max-w-md">
				<form
					onSubmit={(evento) => {
						evento.preventDefault();
						const dados = new FormData(evento.currentTarget);
						aoSalvar(String(dados.get("name") ?? "").trim());
					}}
				>
					<DialogHeader>
						<DialogTitle className="font-sans font-semibold text-base text-ink">
							{editando ? "Renomear família" : "Nova família"}
						</DialogTitle>
						<DialogDescription className="font-sans text-ink-muted text-sm">
							{editando
								? `O endereço da página continua /produtos/${inicial.slug}.`
								: "Ela entra no fim do menu de produtos, e o endereço da página sai do nome."}
						</DialogDescription>
					</DialogHeader>

					<div className="my-5 flex flex-col gap-4">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor={idNome}>Nome</Label>
							<Input
								id={idNome}
								name="name"
								defaultValue={inicial?.name}
								required
								autoComplete="off"
								placeholder="Molhos e Pastas"
							/>
						</div>

						{erro ? (
							<p role="alert" className="font-sans text-brand text-sm">
								{erro}
							</p>
						) : null}
					</div>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={aoFechar}>
							Cancelar
						</Button>
						<Button type="submit" disabled={enviando}>
							{enviando ? "Salvando…" : "Salvar"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
