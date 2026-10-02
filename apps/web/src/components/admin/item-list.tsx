import { cn } from "@my-better-t-app/ui/lib/utils";
import type { CSSProperties, ReactNode } from "react";

/**
 * Listagem do painel: grade com cabeçalho no desktop, cartões no celular.
 *
 * É uma marcação só. Uma `<table>` para o desktop e uma lista para o celular
 * colocariam cada item duas vezes no DOM — dois botões "Editar Melissa" para
 * o leitor de tela escolher. Aqui o mesmo `<li>` muda de forma: no celular o
 * título e os detalhes empilham ao lado da miniatura; a partir de `md` cada
 * detalhe ocupa a própria coluna, alinhado ao cabeçalho.
 *
 * `colunas` é o `grid-template-columns` do desktop e precisa contar, na
 * ordem: mídia (se houver), título, cada detalhe e as ações.
 */

interface ItemListProps {
	/** Nome acessível da lista: "Produtos". */
	rotulo: string;
	colunas: string;
	/** Rótulos das colunas, na mesma ordem de `colunas`. Vazio para pular. */
	cabecalho: readonly string[];
	children: ReactNode;
}

const GRADE =
	"md:grid md:grid-cols-(--colunas) md:items-center md:gap-x-4 md:px-4";

export function ItemList({
	rotulo,
	colunas,
	cabecalho,
	children,
}: ItemListProps) {
	return (
		<div
			style={{ "--colunas": colunas } as CSSProperties}
			className="overflow-hidden rounded-lg border border-brand/12 bg-cream-raised"
		>
			<div
				aria-hidden="true"
				className={cn(
					GRADE,
					"hidden bg-cream-bright py-2.5 font-bold font-sans text-[0.6875rem] text-ink-faint uppercase tracking-[0.08em]",
				)}
			>
				{cabecalho.map((titulo, indice) => (
					// Cabeçalho vazio (mídia, ações) se repete; a posição é a identidade.
					<span key={`${indice}-${titulo}`}>{titulo}</span>
				))}
			</div>
			<ul aria-label={rotulo} className="divide-y divide-brand/12">
				{children}
			</ul>
		</div>
	);
}

interface ItemRowProps {
	midia?: ReactNode;
	titulo: ReactNode;
	/** Uma entrada por coluna do desktop; no celular viram linhas sob o título. */
	detalhes?: readonly ReactNode[];
	acoes: ReactNode;
}

export function ItemRow({ midia, titulo, detalhes = [], acoes }: ItemRowProps) {
	return (
		<li className={cn(GRADE, "flex items-center gap-3 px-3 py-2.5 font-sans")}>
			{midia ? <div className="shrink-0">{midia}</div> : null}

			<div className="flex min-w-0 flex-1 flex-col gap-0.5 md:contents">
				<div className="min-w-0 font-medium text-ink text-sm">{titulo}</div>
				{detalhes.map((detalhe, indice) => (
					<div
						// A ordem das colunas é fixa por tela.
						key={indice}
						className="min-w-0 text-[0.8125rem] text-ink-muted"
					>
						{detalhe}
					</div>
				))}
			</div>

			<div className="flex shrink-0 justify-end gap-0.5">{acoes}</div>
		</li>
	);
}
