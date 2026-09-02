import { Badge } from "@my-better-t-app/ui/components/badge";
import { Button, buttonVariants } from "@my-better-t-app/ui/components/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@my-better-t-app/ui/components/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeading } from "@/components/admin/page-heading";
import { RouteLoader } from "@/components/ui/route-loader";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/admin/receitas/")({
	component: Receitas,
});

/** "1 h 20 min" a partir de 80 — igual ao que a publicação grava. */
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

	return (
		<>
			<PageHeading
				title="Receitas"
				description={`${receitas.data.length} receitas no catálogo.`}
				action={
					<Link to="/admin/receitas/nova" className={buttonVariants()}>
						<Plus aria-hidden="true" />
						Nova receita
					</Link>
				}
			/>

			<div className="overflow-x-auto rounded-lg border border-brand/12 bg-cream-raised">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Nome</TableHead>
							<TableHead>Categoria</TableHead>
							<TableHead>Tempo</TableHead>
							<TableHead>Nível</TableHead>
							<TableHead className="text-right">Produtos citados</TableHead>
							<TableHead className="w-24 text-right">Ações</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{receitas.data.map((receita) => (
							<TableRow key={receita.slug}>
								<TableCell>
									<span className="font-medium text-ink">{receita.name}</span>
									<span className="block text-ink-faint text-xs">
										{receita.slug}
									</span>
								</TableCell>
								<TableCell>
									<Badge variant="secondary">{receita.category}</Badge>
								</TableCell>
								<TableCell className="text-ink-muted tabular-nums">
									{duracao(receita.minutes)}
								</TableCell>
								<TableCell className="text-ink-muted">
									{receita.level}
								</TableCell>
								<TableCell className="text-right text-ink-muted tabular-nums">
									{receita.usedProductSlugs.length}
								</TableCell>
								<TableCell className="text-right">
									<div className="flex justify-end gap-1">
										<Link
											to="/admin/receitas/$slug"
											params={{ slug: receita.slug }}
											aria-label={`Editar ${receita.name}`}
											className={buttonVariants({
												variant: "ghost",
												size: "icon-sm",
											})}
										>
											<Pencil aria-hidden="true" />
										</Link>
										<Button
											variant="ghost"
											size="icon-sm"
											aria-label={`Remover ${receita.name}`}
											onClick={() => {
												if (confirm(`Remover "${receita.name}" do catálogo?`)) {
													remover.mutate({ slug: receita.slug });
												}
											}}
										>
											<Trash2 aria-hidden="true" />
										</Button>
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</>
	);
}
