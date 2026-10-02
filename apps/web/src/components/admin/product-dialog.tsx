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
	/** Ausente ao criar: o domínio deriva do nome. */
	slug?: string;
	name: string;
	familySlug: string;
	image: string;
}

interface ProductDialogProps {
	aberto: boolean;
	aoFechar: () => void;
	/** Ausente ao criar; presente ao editar. */
	inicial?: ProdutoFormulario;
	/** Família que já vem escolhida ao criar a partir de uma lista filtrada. */
	familiaSugerida?: string;
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
 *
 * O slug não é perguntado: quem cadastra um produto pensa no nome, e o
 * identificador sai dele em `criarNovoProduto`.
 */
export function ProductDialog({
	aberto,
	aoFechar,
	inicial,
	familiaSugerida,
	familias,
	enviando,
	erro,
	aoSalvar,
}: ProductDialogProps) {
	const ids = {
		name: useId(),
		familia: useId(),
		image: useId(),
		ajudaImagem: useId(),
	};
	const editando = inicial !== undefined;
	const [familia, setFamilia] = useState(
		inicial?.familySlug ?? familiaSugerida ?? familias[0]?.slug ?? "",
	);

	return (
		<Dialog open={aberto} onOpenChange={(estado) => !estado && aoFechar()}>
			<DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto p-5 sm:max-w-md">
				<form
					onSubmit={(evento) => {
						evento.preventDefault();
						const dados = new FormData(evento.currentTarget);
						aoSalvar({
							slug: inicial?.slug,
							name: String(dados.get("name") ?? "").trim(),
							familySlug: familia,
							image: String(dados.get("image") ?? "").trim(),
						});
					}}
				>
					<DialogHeader>
						<DialogTitle className="font-sans font-semibold text-base text-ink">
							{editando ? "Editar produto" : "Novo produto"}
						</DialogTitle>
						<DialogDescription className="font-sans text-ink-muted text-sm">
							{editando
								? "O que você salvar aqui vale para o catálogo inteiro."
								: "Ele entra no fim da lista da família escolhida."}
						</DialogDescription>
					</DialogHeader>

					<div className="my-5 flex flex-col gap-4">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor={ids.name}>Nome</Label>
							<Input
								id={ids.name}
								name="name"
								defaultValue={inicial?.name}
								required
								autoComplete="off"
								placeholder="Páprica Doce"
							/>
						</div>

						<div className="flex flex-col gap-1.5">
							<Label htmlFor={ids.familia}>Família</Label>
							<select
								id={ids.familia}
								value={familia}
								onChange={(evento) => setFamilia(evento.target.value)}
								className="border border-input px-3 font-sans"
							>
								{familias.map((item) => (
									<option key={item.slug} value={item.slug}>
										{item.name}
									</option>
								))}
							</select>
						</div>

						<div className="flex flex-col gap-1.5">
							<Label htmlFor={ids.image}>Foto do produto</Label>
							<Input
								id={ids.image}
								name="image"
								defaultValue={inicial?.image}
								aria-describedby={ids.ajudaImagem}
								autoComplete="off"
								placeholder="/images/products/temperos-em-po/sachet-paprica-doce.webp"
							/>
							<p
								id={ids.ajudaImagem}
								className="font-sans text-ink-faint text-xs"
							>
								Caminho do arquivo da foto. Deixe vazio enquanto ela não existir
								— o envio de fotos pelo painel chega numa próxima etapa.
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
