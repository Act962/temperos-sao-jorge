import { Button } from "@my-better-t-app/ui/components/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@my-better-t-app/ui/components/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeading } from "@/components/admin/page-heading";
import {
	ProductDialog,
	type ProdutoFormulario,
} from "@/components/admin/product-dialog";
import { RouteLoader } from "@/components/ui/route-loader";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/admin/produtos")({
	validateSearch: (busca: Record<string, unknown>) => ({
		familia: typeof busca.familia === "string" ? busca.familia : undefined,
	}),
	component: Produtos,
});

function Falha({ mensagem }: { mensagem: string }) {
	return (
		<p role="alert" className="font-sans text-brand text-sm">
			{mensagem}
		</p>
	);
}

function Produtos() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { familia } = Route.useSearch();

	const [dialogo, setDialogo] = useState<
		{ aberto: false } | { aberto: true; inicial?: ProdutoFormulario }
	>({ aberto: false });
	const [erro, setErro] = useState<string | null>(null);

	const produtos = useQuery(
		trpc.catalog.produtos.listar.queryOptions(
			familia ? { familia } : undefined,
		),
	);
	const familias = useQuery(trpc.catalog.familias.listar.queryOptions());

	/** Recarrega listas e resumo após qualquer escrita. */
	const revalidar = () => queryClient.invalidateQueries();

	const criar = useMutation(
		trpc.catalog.produtos.criar.mutationOptions({
			onSuccess: async (produto) => {
				await revalidar();
				setDialogo({ aberto: false });
				toast.success(`"${produto.name}" criado.`);
			},
			onError: (e) => setErro(e.message),
		}),
	);

	const atualizar = useMutation(
		trpc.catalog.produtos.atualizar.mutationOptions({
			onSuccess: async (produto) => {
				await revalidar();
				setDialogo({ aberto: false });
				toast.success(`"${produto.name}" atualizado.`);
			},
			onError: (e) => setErro(e.message),
		}),
	);

	const remover = useMutation(
		trpc.catalog.produtos.remover.mutationOptions({
			onSuccess: async () => {
				await revalidar();
				toast.success("Produto removido.");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	if (produtos.isPending || familias.isPending) return <RouteLoader />;

	// As duas consultas são conferidas em separado porque o TypeScript só
	// estreita a união do React Query quando o teste é feito no próprio objeto.
	// O seletor de famílias mora no diálogo, então falhar ali impede editar.
	if (produtos.isError) {
		return <Falha mensagem={produtos.error.message} />;
	}
	if (familias.isError) {
		return <Falha mensagem={familias.error.message} />;
	}

	const salvar = (dados: ProdutoFormulario) => {
		setErro(null);
		const image = dados.image === "" ? null : dados.image;

		if (dialogo.aberto && dialogo.inicial) {
			atualizar.mutate({
				slug: dados.slug,
				dados: { name: dados.name, familySlug: dados.familySlug, image },
			});
			return;
		}
		criar.mutate({ ...dados, image });
	};

	return (
		<>
			<PageHeading
				title="Produtos"
				description={
					familia
						? `Família ${familia} — ${produtos.data.length} produtos.`
						: `${produtos.data.length} produtos no catálogo.`
				}
				action={
					<Button
						onClick={() => {
							setErro(null);
							setDialogo({ aberto: true });
						}}
					>
						<Plus aria-hidden="true" />
						Novo produto
					</Button>
				}
			/>

			<div className="overflow-x-auto rounded-lg border border-brand/12 bg-cream-raised">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Nome</TableHead>
							<TableHead>Família</TableHead>
							<TableHead>Packshot</TableHead>
							<TableHead className="w-24 text-right">Ações</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{produtos.data.map((produto) => (
							<TableRow key={produto.slug}>
								<TableCell>
									<span className="font-medium text-ink">{produto.name}</span>
									<span className="block text-ink-faint text-xs">
										{produto.slug}
									</span>
								</TableCell>
								<TableCell className="text-ink-muted">
									{produto.familySlug}
								</TableCell>
								<TableCell>
									{produto.image ? (
										<img
											src={produto.image}
											alt=""
											className="size-10 object-contain"
										/>
									) : (
										<span className="text-ink-faint text-xs">sem foto</span>
									)}
								</TableCell>
								<TableCell className="text-right">
									<div className="flex justify-end gap-1">
										<Button
											variant="ghost"
											size="icon-sm"
											aria-label={`Editar ${produto.name}`}
											onClick={() => {
												setErro(null);
												setDialogo({
													aberto: true,
													inicial: {
														slug: produto.slug,
														name: produto.name,
														familySlug: produto.familySlug,
														image: produto.image ?? "",
													},
												});
											}}
										>
											<Pencil aria-hidden="true" />
										</Button>
										<Button
											variant="ghost"
											size="icon-sm"
											aria-label={`Remover ${produto.name}`}
											onClick={() => {
												if (confirm(`Remover "${produto.name}" do catálogo?`)) {
													remover.mutate({ slug: produto.slug });
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

			{dialogo.aberto ? (
				<ProductDialog
					aberto
					aoFechar={() => setDialogo({ aberto: false })}
					inicial={dialogo.inicial}
					familias={familias.data}
					enviando={criar.isPending || atualizar.isPending}
					erro={erro}
					aoSalvar={salvar}
				/>
			) : null}
		</>
	);
}
