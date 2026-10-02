import { Badge } from "@my-better-t-app/ui/components/badge";
import { Button, buttonVariants } from "@my-better-t-app/ui/components/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { EmptyState } from "@/components/admin/empty-state";
import { filtrarPorTermo } from "@/components/admin/filtro";
import { ItemList, ItemRow } from "@/components/admin/item-list";
import { PageHeading } from "@/components/admin/page-heading";
import { SearchField } from "@/components/admin/search-field";
import { RouteLoader } from "@/components/ui/route-loader";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/admin/receitas/")({
	validateSearch: (busca: Record<string, unknown>): { busca?: string } => ({
		busca:
			typeof busca.busca === "string" && busca.busca !== ""
				? busca.busca
				: undefined,
	}),
	component: Receitas,
});

/** "1 h 20 min" a partir de 80 — igual ao que o site exibe. */
function duracao(minutes: number): string {
	const horas = Math.floor(minutes / 60);
	const resto = minutes % 60;
	if (horas === 0) return `${resto} min`;
	if (resto === 0) return `${horas} h`;
	return `${horas} h ${resto} min`;
}

function Receitas() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const navigate = Route.useNavigate();
	const { busca = "" } = Route.useSearch();
	const [remocao, setRemocao] = useState<{
		slug: string;
		name: string;
	} | null>(null);

	const receitas = useQuery(trpc.catalog.receitas.listar.queryOptions());

	const remover = useMutation(
		trpc.catalog.receitas.remover.mutationOptions({
			onSuccess: async () => {
				await queryClient.invalidateQueries();
				toast.success("Receita removida.");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	if (receitas.isPending) return <RouteLoader />;

	if (receitas.isError) {
		return (
			<p role="alert" className="font-sans text-brand text-sm">
				{receitas.error.message}
			</p>
		);
	}

	const visiveis = filtrarPorTermo(receitas.data, busca, (r) => r.name);

	return (
		<>
			<PageHeading
				title="Receitas"
				description={
					busca
						? `${visiveis.length} de ${receitas.data.length} receitas.`
						: `${receitas.data.length} receitas no catálogo.`
				}
				action={
					<Link to="/admin/receitas/nova" className={buttonVariants()}>
						<Plus aria-hidden="true" />
						Nova receita
					</Link>
				}
			/>

			<div className="mb-4 max-w-md">
				<SearchField
					rotulo="Buscar receita"
					placeholder="Buscar por nome…"
					valor={busca}
					aoMudar={(valor) =>
						navigate({ search: { busca: valor || undefined }, replace: true })
					}
				/>
			</div>

			{visiveis.length === 0 ? (
				<EmptyState
					titulo={
						busca ? "Nenhuma receita encontrada" : "Nenhuma receita cadastrada"
					}
				>
					{busca ? (
						<Link
							to="/admin/receitas"
							className="font-semibold text-brand underline underline-offset-4"
						>
							Limpar busca
						</Link>
					) : (
						"Use “Nova receita” para escrever a primeira."
					)}
				</EmptyState>
			) : (
				<ItemList
					rotulo="Receitas"
					colunas="minmax(0,1.6fr) 6rem 5.5rem 4.5rem 6.5rem 5.5rem"
					cabecalho={["Nome", "Categoria", "Tempo", "Nível", "Produtos", ""]}
				>
					{visiveis.map((receita) => (
						<ItemRow
							key={receita.slug}
							titulo={receita.name}
							detalhes={[
								<Badge key="categoria" variant="secondary">
									{receita.category}
								</Badge>,
								<span key="tempo" className="tabular-nums">
									{duracao(receita.minutes)}
								</span>,
								receita.level,
								// No celular esta linha fica sozinha sob o título: sem a
								// palavra, o número não diz o que conta.
								<span key="produtos" className="tabular-nums">
									{receita.usedProductSlugs.length === 1
										? "1 produto"
										: `${receita.usedProductSlugs.length} produtos`}
								</span>,
							]}
							acoes={
								<>
									<Link
										to="/admin/receitas/$slug"
										params={{ slug: receita.slug }}
										aria-label={`Editar ${receita.name}`}
										className={buttonVariants({
											variant: "ghost",
											size: "icon",
										})}
									>
										<Pencil aria-hidden="true" />
									</Link>
									<Button
										variant="ghost"
										size="icon"
										aria-label={`Remover ${receita.name}`}
										onClick={() =>
											setRemocao({ slug: receita.slug, name: receita.name })
										}
									>
										<Trash2 aria-hidden="true" />
									</Button>
								</>
							}
						/>
					))}
				</ItemList>
			)}

			<ConfirmDialog
				aberto={remocao !== null}
				titulo={`Remover “${remocao?.name ?? ""}”?`}
				descricao="A receita sai do site. Esta ação não pode ser desfeita."
				aoCancelar={() => setRemocao(null)}
				aoConfirmar={() => {
					if (remocao) remover.mutate({ slug: remocao.slug });
					setRemocao(null);
				}}
			/>
		</>
	);
}
