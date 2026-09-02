import { Badge } from "@my-better-t-app/ui/components/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@my-better-t-app/ui/components/table";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeading } from "@/components/admin/page-heading";
import { RouteLoader } from "@/components/ui/route-loader";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/admin/receitas")({
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
	const receitas = useQuery(trpc.catalog.receitas.listar.queryOptions());

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
				description={`${receitas.data.length} receitas publicadas.`}
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
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			<p className="mt-4 font-sans text-ink-faint text-sm">
				A edição de receitas entra na próxima fatia. O domínio e a API já
				suportam criar, atualizar e remover.
			</p>
		</>
	);
}
