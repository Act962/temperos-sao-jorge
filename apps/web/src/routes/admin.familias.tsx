import { Button } from "@my-better-t-app/ui/components/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { EmptyState } from "@/components/admin/empty-state";
import { FamilyDialog } from "@/components/admin/family-dialog";
import { ItemList, ItemRow } from "@/components/admin/item-list";
import { PageHeading } from "@/components/admin/page-heading";
import { RouteLoader } from "@/components/ui/route-loader";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/admin/familias")({
	component: Familias,
});

interface Familia {
	slug: string;
	name: string;
}

function Familias() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const [dialogo, setDialogo] = useState<
		{ aberto: false } | { aberto: true; inicial?: Familia }
	>({ aberto: false });
	const [erro, setErro] = useState<string | null>(null);
	const [remocao, setRemocao] = useState<Familia | null>(null);

	const familias = useQuery(trpc.catalog.familias.listar.queryOptions());

	const revalidar = () => queryClient.invalidateQueries();

	const criar = useMutation(
		trpc.catalog.familias.criar.mutationOptions({
			onSuccess: async (familia) => {
				await revalidar();
				setDialogo({ aberto: false });
				toast.success(`Família "${familia.name}" criada.`);
			},
			onError: (e) => setErro(e.message),
		}),
	);

	const renomear = useMutation(
		trpc.catalog.familias.renomear.mutationOptions({
			onSuccess: async (familia) => {
				await revalidar();
				setDialogo({ aberto: false });
				toast.success(`Família renomeada para "${familia.name}".`);
			},
			onError: (e) => setErro(e.message),
		}),
	);

	const reordenar = useMutation(
		trpc.catalog.familias.reordenar.mutationOptions({
			onSuccess: revalidar,
			onError: (e) => toast.error(e.message),
		}),
	);

	const remover = useMutation(
		trpc.catalog.familias.remover.mutationOptions({
			onSuccess: async () => {
				await revalidar();
				toast.success("Família removida.");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	if (familias.isPending) return <RouteLoader />;

	if (familias.isError) {
		return (
			<p role="alert" className="font-sans text-brand text-sm">
				{familias.error.message}
			</p>
		);
	}

	const lista = familias.data;

	const mover = (indice: number, para: number) => {
		const ordem = lista.map((familia) => familia.slug);
		[ordem[indice], ordem[para]] = [ordem[para], ordem[indice]];
		reordenar.mutate({ ordem });
	};

	return (
		<>
			<PageHeading
				title="Famílias"
				description="As linhas de produto. A ordem daqui é a do menu, do rodapé e da página inicial do site."
				action={
					<Button
						onClick={() => {
							setErro(null);
							setDialogo({ aberto: true });
						}}
					>
						<Plus aria-hidden="true" />
						Nova família
					</Button>
				}
			/>

			{lista.length === 0 ? (
				<EmptyState titulo="Nenhuma família cadastrada">
					Crie a primeira para poder cadastrar produtos.
				</EmptyState>
			) : (
				<ItemList
					rotulo="Famílias"
					colunas="4.75rem minmax(0,1.4fr) minmax(0,1fr) 5.5rem"
					cabecalho={["Ordem", "Nome", "Produtos", ""]}
				>
					{lista.map((familia, indice) => (
						<ItemRow
							key={familia.slug}
							midia={
								<div className="flex">
									<Button
										variant="ghost"
										size="icon"
										aria-label={`Subir ${familia.name}`}
										disabled={indice === 0 || reordenar.isPending}
										onClick={() => mover(indice, indice - 1)}
									>
										<ArrowUp aria-hidden="true" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										aria-label={`Descer ${familia.name}`}
										disabled={
											indice === lista.length - 1 || reordenar.isPending
										}
										onClick={() => mover(indice, indice + 1)}
									>
										<ArrowDown aria-hidden="true" />
									</Button>
								</div>
							}
							titulo={familia.name}
							detalhes={[
								<Link
									key="produtos"
									to="/admin/produtos"
									search={{ familia: familia.slug }}
									className="underline decoration-brand/30 underline-offset-4 hover:text-brand"
								>
									{familia.count === 1
										? "1 produto"
										: `${familia.count} produtos`}
								</Link>,
							]}
							acoes={
								<>
									<Button
										variant="ghost"
										size="icon"
										aria-label={`Renomear ${familia.name}`}
										onClick={() => {
											setErro(null);
											setDialogo({
												aberto: true,
												inicial: { slug: familia.slug, name: familia.name },
											});
										}}
									>
										<Pencil aria-hidden="true" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										aria-label={`Remover ${familia.name}`}
										onClick={() =>
											setRemocao({ slug: familia.slug, name: familia.name })
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

			{dialogo.aberto ? (
				<FamilyDialog
					aberto
					aoFechar={() => setDialogo({ aberto: false })}
					inicial={dialogo.inicial}
					enviando={criar.isPending || renomear.isPending}
					erro={erro}
					aoSalvar={(name) => {
						setErro(null);
						if (dialogo.inicial) {
							renomear.mutate({ slug: dialogo.inicial.slug, name });
							return;
						}
						criar.mutate({ name });
					}}
				/>
			) : null}

			<ConfirmDialog
				aberto={remocao !== null}
				titulo={`Remover a família “${remocao?.name ?? ""}”?`}
				descricao="A página dela sai do site. Só é possível remover uma família sem produtos."
				aoCancelar={() => setRemocao(null)}
				aoConfirmar={() => {
					if (remocao) remover.mutate({ slug: remocao.slug });
					setRemocao(null);
				}}
			/>
		</>
	);
}
