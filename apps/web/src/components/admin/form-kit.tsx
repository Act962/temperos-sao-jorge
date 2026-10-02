import { Button } from "@my-better-t-app/ui/components/button";
import { Input } from "@my-better-t-app/ui/components/input";
import { Label } from "@my-better-t-app/ui/components/label";
import { Textarea } from "@my-better-t-app/ui/components/textarea";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { type ReactNode, useEffect, useId, useState } from "react";

/**
 * Peças dos formulários de conteúdo: Configurações, Início, Sobre e as
 * políticas.
 *
 * Todas as telas seguem o mesmo desenho, aprovado em mock: um cartão por
 * seção do site, na ordem em que aparece, e uma barra fixa embaixo com
 * "Salvar". Salvar grava o documento inteiro e já vale no site.
 */

/**
 * Estado de um documento em edição.
 *
 * `base` é o que está salvo; `rascunho` é o que está na tela. A comparação por
 * JSON é suficiente — os documentos são objetos simples, sem data nem função —
 * e poupa marcar campo a campo o que mudou.
 */
export function useDocumentForm<T>(inicial: T) {
	const [base, setBase] = useState(inicial);
	const [rascunho, setRascunho] = useState(inicial);
	const sujo = JSON.stringify(base) !== JSON.stringify(rascunho);

	// Fechar a aba ou recarregar com alteração pendente perderia o trabalho em
	// silêncio. O texto do aviso é do navegador; aqui só se pede que ele apareça.
	useEffect(() => {
		if (!sujo) return;
		const avisar = (evento: BeforeUnloadEvent) => evento.preventDefault();
		window.addEventListener("beforeunload", avisar);
		return () => window.removeEventListener("beforeunload", avisar);
	}, [sujo]);

	return {
		rascunho,
		sujo,
		mudar: setRascunho,
		descartar: () => setRascunho(base),
		/** Depois de salvar: o que o servidor devolveu passa a ser a base. */
		aceitar: (salvo: T) => {
			setBase(salvo);
			setRascunho(salvo);
		},
	};
}

interface FormSectionProps {
	titulo: string;
	ajuda?: string;
	/** Onde isto aparece no site: "topo da página", "rodapé". */
	onde?: string;
	children: ReactNode;
}

/** Um cartão por seção do site. */
export function FormSection({
	titulo,
	ajuda,
	onde,
	children,
}: FormSectionProps) {
	const idTitulo = useId();

	return (
		<section
			aria-labelledby={idTitulo}
			className="rounded-lg border border-brand/12 bg-cream-raised p-4 sm:p-5"
		>
			<header className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
				<div className="min-w-0">
					<h2 id={idTitulo} className="font-sans font-semibold text-ink">
						{titulo}
					</h2>
					{ajuda ? (
						<p className="mt-0.5 font-sans text-[0.8125rem] text-ink-faint">
							{ajuda}
						</p>
					) : null}
				</div>
				{onde ? (
					<span className="shrink-0 rounded-full bg-brand/8 px-2.5 py-1 font-sans font-semibold text-[0.6875rem] text-brand">
						{onde}
					</span>
				) : null}
			</header>
			<div className="flex flex-col gap-4">{children}</div>
		</section>
	);
}

interface TextFieldProps {
	rotulo: string;
	valor: string;
	aoMudar: (valor: string) => void;
	ajuda?: string;
	/** Área de texto com este número de linhas, em vez de campo de uma linha. */
	linhas?: number;
	tipo?: "text" | "email" | "tel" | "url" | "password";
	placeholder?: string;
	autoComplete?: string;
	obrigatorio?: boolean;
}

export function TextField({
	rotulo,
	valor,
	aoMudar,
	ajuda,
	linhas,
	tipo = "text",
	placeholder,
	autoComplete = "off",
	obrigatorio,
}: TextFieldProps) {
	const id = useId();
	const idAjuda = useId();

	return (
		<div className="flex min-w-0 flex-col gap-1.5">
			<Label htmlFor={id}>{rotulo}</Label>
			{linhas ? (
				<Textarea
					id={id}
					value={valor}
					rows={linhas}
					placeholder={placeholder}
					aria-describedby={ajuda ? idAjuda : undefined}
					onChange={(evento) => aoMudar(evento.target.value)}
				/>
			) : (
				<Input
					id={id}
					type={tipo}
					value={valor}
					placeholder={placeholder}
					autoComplete={autoComplete}
					required={obrigatorio}
					aria-describedby={ajuda ? idAjuda : undefined}
					onChange={(evento) => aoMudar(evento.target.value)}
				/>
			)}
			{ajuda ? (
				<p id={idAjuda} className="font-sans text-ink-faint text-xs">
					{ajuda}
				</p>
			) : null}
		</div>
	);
}

interface EditableListProps<T> {
	/** Nome do item, para os rótulos: "marco", "parágrafo". */
	nomeDoItem: string;
	itens: readonly T[];
	aoMudar: (itens: T[]) => void;
	/** Ausente quando a quantidade é fixa: sem adicionar nem remover. */
	novoItem?: () => T;
	textoAdicionar?: string;
	children: (item: T, mudar: (item: T) => void, indice: number) => ReactNode;
}

/**
 * Lista editável com subir, descer, remover e adicionar.
 *
 * Mesma decisão da 0003: sem arrastar e soltar. Subir e descer funcionam com
 * teclado e no celular, e as listas daqui têm meia dúzia de itens.
 */
export function EditableList<T>({
	nomeDoItem,
	itens,
	aoMudar,
	novoItem,
	textoAdicionar,
	children,
}: EditableListProps<T>) {
	const trocar = (de: number, para: number) => {
		const copia = [...itens];
		const [a, b] = [copia[de], copia[para]];
		if (a === undefined || b === undefined) return;
		copia[de] = b;
		copia[para] = a;
		aoMudar(copia);
	};

	return (
		<div className="flex flex-col gap-3">
			<ol className="flex flex-col gap-3">
				{itens.map((item, indice) => (
					// A posição é a identidade: itens novos nascem em branco, e dois
					// podem ter o mesmo texto.
					<li
						key={indice}
						className="rounded-md border border-brand/12 bg-cream-bright p-3"
					>
						<div className="mb-2 flex items-center justify-between gap-2">
							<span className="font-sans font-semibold text-ink-faint text-xs uppercase tracking-[0.08em]">
								{nomeDoItem} {indice + 1}
							</span>
							<div className="flex">
								<Button
									type="button"
									variant="ghost"
									size="icon"
									aria-label={`Subir ${nomeDoItem} ${indice + 1}`}
									disabled={indice === 0}
									onClick={() => trocar(indice, indice - 1)}
								>
									<ArrowUp aria-hidden="true" />
								</Button>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									aria-label={`Descer ${nomeDoItem} ${indice + 1}`}
									disabled={indice === itens.length - 1}
									onClick={() => trocar(indice, indice + 1)}
								>
									<ArrowDown aria-hidden="true" />
								</Button>
								{novoItem ? (
									<Button
										type="button"
										variant="ghost"
										size="icon"
										aria-label={`Remover ${nomeDoItem} ${indice + 1}`}
										onClick={() =>
											aoMudar(itens.filter((_, outro) => outro !== indice))
										}
									>
										<Trash2 aria-hidden="true" />
									</Button>
								) : null}
							</div>
						</div>
						<div className="flex flex-col gap-3">
							{children(
								item,
								(novo) => {
									const copia = [...itens];
									copia[indice] = novo;
									aoMudar(copia);
								},
								indice,
							)}
						</div>
					</li>
				))}
			</ol>

			{novoItem ? (
				<div>
					<Button
						type="button"
						variant="outline"
						onClick={() => aoMudar([...itens, novoItem()])}
					>
						<Plus aria-hidden="true" />
						{textoAdicionar ?? `Adicionar ${nomeDoItem}`}
					</Button>
				</div>
			) : null}
		</div>
	);
}

interface SaveBarProps {
	sujo: boolean;
	enviando: boolean;
	erro: string | null;
	aoDescartar: () => void;
}

/**
 * Barra de salvar, presa ao pé da tela.
 *
 * Fica dentro do `<form>`: o botão é o `submit`, então Enter num campo também
 * salva. Presa embaixo porque os formulários são longos — no Ipê o botão fica
 * no fim do cartão e obriga a rolar até lá.
 */
export function SaveBar({ sujo, enviando, erro, aoDescartar }: SaveBarProps) {
	return (
		<div className="sticky bottom-0 z-20 -mx-4 mt-2 border-brand/12 border-t bg-cream-bright px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
			{erro ? (
				<p role="alert" className="mb-2 font-sans text-brand text-sm">
					{erro}
				</p>
			) : null}
			<div className="flex items-center gap-2">
				<p
					aria-live="polite"
					className="mr-auto font-sans text-[0.8125rem] text-ink-faint max-sm:hidden"
				>
					{sujo
						? "Há alterações não salvas."
						: "Tudo salvo. O que está aqui é o que o site mostra."}
				</p>
				<Button
					type="button"
					variant="outline"
					disabled={!sujo || enviando}
					onClick={aoDescartar}
					className="max-sm:flex-1"
				>
					Descartar
				</Button>
				<Button
					type="submit"
					disabled={!sujo || enviando}
					className="max-sm:flex-1"
				>
					{enviando ? "Salvando…" : "Salvar"}
				</Button>
			</div>
		</div>
	);
}

/** Mensagem de falha ao carregar o documento. */
export function LoadError({ mensagem }: { mensagem: string }) {
	return (
		<p role="alert" className="font-sans text-brand text-sm">
			Não foi possível carregar: {mensagem}
		</p>
	);
}
