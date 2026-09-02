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
import { useId, useState } from "react";

export interface ProdutoFormulario {
	slug: string;
	name: string;
	familySlug: string;
	image: string;
}

interface ProductDialogProps {
	aberto: boolean;
	aoFechar: () => void;
	/** Ausente ao criar; presente ao editar. */
	inicial?: ProdutoFormulario;
	familias: readonly { slug: string; name: string }[];
	enviando: boolean;
	erro: string | null;
	aoSalvar: (dados: ProdutoFormulario) => void;
}

/**
 * Formulário de produto.
 *
 * Não valida packshot nem slug aqui: quem decide é o domínio, e o erro dele
 * aparece no lugar da mensagem. Duplicar a regra na tela criaria uma segunda
 * verdade para manter em sincronia.
 */
export function ProductDialog({
	aberto,
	aoFechar,
	inicial,
	familias,
	enviando,
	erro,
	aoSalvar,
}: ProductDialogProps) {
	const ids = {
		slug: useId(),
		name: useId(),
		familia: useId(),
		image: useId(),
	};
	const editando = inicial !== undefined;
	const [familia, setFamilia] = useState(
		inicial?.familySlug ?? familias[0]?.slug ?? "",
	);

	return (
		<Dialog open={aberto} onOpenChange={(estado) => !estado && aoFechar()}>
			<DialogContent className="sm:max-w-md">
				<form
					onSubmit={(evento) => {
						evento.preventDefault();
						const dados = new FormData(evento.currentTarget);
						aoSalvar({
							slug: String(dados.get("slug") ?? "").trim(),
							name: String(dados.get("name") ?? "").trim(),
							familySlug: familia,
							image: String(dados.get("image") ?? "").trim(),
						});
					}}
				>
					<DialogHeader>
						<DialogTitle>
							{editando ? "Editar produto" : "Novo produto"}
						</DialogTitle>
						<DialogDescription>
							O packshot segue o padrão do pipeline de imagens.
						</DialogDescription>
					</DialogHeader>

					<div className="my-6 flex flex-col gap-4">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor={ids.slug}>Slug</Label>
							<Input
								id={ids.slug}
								name="slug"
								defaultValue={inicial?.slug}
								readOnly={editando}
								required
								placeholder="paprica-doce"
							/>
							{editando ? (
								<p className="font-sans text-ink-faint text-xs">
									O slug é a URL do produto e não muda depois de criado.
								</p>
							) : null}
						</div>

						<div className="flex flex-col gap-1.5">
							<Label htmlFor={ids.name}>Nome</Label>
							<Input
								id={ids.name}
								name="name"
								defaultValue={inicial?.name}
								required
								placeholder="Páprica Doce"
							/>
						</div>

						<div className="flex flex-col gap-1.5">
							<Label htmlFor={ids.familia}>Família</Label>
							<select
								id={ids.familia}
								value={familia}
								onChange={(evento) => setFamilia(evento.target.value)}
								className="h-9 rounded-md border border-input bg-transparent px-3 font-sans text-sm"
							>
								{familias.map((item) => (
									<option key={item.slug} value={item.slug}>
										{item.name}
									</option>
								))}
							</select>
						</div>

						<div className="flex flex-col gap-1.5">
							<Label htmlFor={ids.image}>Packshot</Label>
							<Input
								id={ids.image}
								name="image"
								defaultValue={inicial?.image}
								placeholder="/images/products/temperos-em-po/sachet-paprica-doce.webp"
							/>
							<p className="font-sans text-ink-faint text-xs">
								Deixe vazio enquanto a foto não existir.
							</p>
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
