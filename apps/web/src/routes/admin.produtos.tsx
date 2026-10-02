import { Button } from "@my-better-t-app/ui/components/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { EmptyState } from "@/components/admin/empty-state";
import { filtrarPorTermo } from "@/components/admin/filtro";
import { ItemList, ItemRow } from "@/components/admin/item-list";
import { PageHeading } from "@/components/admin/page-heading";
import {
	ProductDialog,
	type ProdutoFormulario,
} from "@/components/admin/product-dialog";
import { SearchField } from "@/components/admin/search-field";
import { RouteLoader } from "@/components/ui/route-loader";
import { useTRPC } from "@/utils/trpc";

interface Busca {
	familia?: string;
	busca?: string;
	semFoto?: boolean;
}

export const Route = createFileRoute("/admin/produtos")({
	// Filtro na URL: o link da visão geral para uma família, ou para os
	// produtos sem foto, precisa funcionar colado no navegador.
	validateSearch: (busca: Record<string, unknown>): Busca => ({
		familia: typeof busca.familia === "string" ? busca.familia : undefined,
		busca:
			typeof busca.busca === "string" && busca.busca !== ""
				? busca.busca
				: undefined,
		semFoto: busca.semFoto === true || busca.semFoto === "true" || undefined,
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

const CLASSE_FICHA =
	"flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-brand/15 bg-cream-bright px-3.5 font-medium font-sans text-[0.8125rem] text-ink-soft transition-colors hover:border-brand/40 aria-[current]:border-brand aria-[current]:bg-brand aria-[current]:text-white";

interface FichaProps {
	filtro: Busca;
	ativa: boolean;
	children: ReactNode;
}

/**
 * Ficha de filtro: uma âncora de verdade, com o estado ativo decidido aqui.
 *
 * Não é um `<Link>` porque o roteador compara a busca por subconjunto: a de
 * "Todos" está contida em qualquer filtro, então ele sairia marcado como
 * página atual junto com a família escolhida — duas fichas "atuais" para o
 * leitor de tela.
 */
function Ficha({ filtro, ativa, children }: FichaProps) {
	const router = useRouter();
	const navigate = Route.useNavigate();
	const destino = router.buildLocation({
		to: "/admin/produtos",
		search: filtro,
	});

	return (
		<a
			href={destino.href}
			aria-current={ativa ? "true" : undefined}
			className={CLASSE_FICHA}
			onClick={(evento) => {
				// Ctrl, Cmd e botão do meio continuam abrindo em outra aba.
				if (evento.metaKey || evento.ctrlKey || evento.shiftKey) return;
				evento.preventDefault();
				navigate({ search: filtro });
			}}
		>
			{children}
		</a>
	);
}

function Miniatura({ src }: { src: string | null }) {
	if (!src) {
		return (
			<span className="flex size-11 items-center justify-center rounded-md border border-brand/30 border-dashed text-center font-sans text-[0.625rem] text-ink-faint leading-tight">
				sem foto
			</span>
		);
	}
	return (
		<img
			src={src}
			alt=""
			loading="lazy"
			className="size-11 rounded-md bg-cream-sunken object-contain p-0.5"
		/>
	);
}

function Produtos() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const navigate = Route.useNavigate();
	const { familia, busca = "", semFoto } = Route.useSearch();

	const [dialogo, setDialogo] = useState<
		{ aberto: false } | { aberto: true; inicial?: ProdutoFormulario }
	>({ aberto: false });
	const [erro, setErro] = useState<string | null>(null);
	const [remocao, setRemocao] = useState<{
		slug: string;
		name: string;
	} | null>(null);

	// O catálogo vem inteiro e o filtro roda aqui: são poucas dezenas de linhas,
	// e uma ida ao servidor por tecla só acrescentaria espera à busca.
	const produtos = useQuery(trpc.catalog.produtos.listar.queryOptions());
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

	const nomeDaFamilia = new Map(familias.data.map((f) => [f.slug, f.name]));
	const familiaAtiva = familias.data.find((f) => f.slug === familia);

	const daFamilia = familia
		? produtos.data.filter((p) => p.familySlug === familia)
		: produtos.data;
	const comFiltroDeFoto = semFoto
		? daFamilia.filter((p) => p.image === null)
		: daFamilia;
	const visiveis = filtrarPorTermo(comFiltroDeFoto, busca, (p) => p.name);
	const filtrando = Boolean(familia || busca || semFoto);

	const salvar = (dados: ProdutoFormulario) => {
		setErro(null);
		const image = dados.image === "" ? null : dados.image;

		if (dados.slug) {
			atualizar.mutate({
				slug: dados.slug,
				dados: { name: dados.name, familySlug: dados.familySlug, image },
			});
			return;
		}
		criar.mutate({ name: dados.name, familySlug: dados.familySlug, image });
	};

	return (
		<>
			<PageHeading
				title="Produtos"
				description={
					filtrando
						? `${visiveis.length} de ${produtos.data.length} produtos${familiaAtiva ? ` — família ${familiaAtiva.name}` : ""}${semFoto ? " — sem foto" : ""}.`
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

			<div className="mb-3 max-w-md">
				<SearchField
					rotulo="Buscar produto"
					placeholder="Buscar por nome…"
					valor={busca}
					aoMudar={(valor) =>
						navigate({
							search: (atual) => ({ ...atual, busca: valor || undefined }),
							replace: true,
						})
					}
				/>
			</div>

			<nav
				aria-label="Filtrar por família"
				className="-mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0"
			>
				<Ficha
					filtro={{ busca: busca || undefined }}
					ativa={!familia && !semFoto}
				>
					Todos
					<span className="opacity-65">{produtos.data.length}</span>
				</Ficha>
				{familias.data.map((item) => (
					<Ficha
						key={item.slug}
						filtro={{ familia: item.slug, busca: busca || undefined }}
						ativa={familia === item.slug}
					>
						{item.name}
						<span className="opacity-65">{item.count}</span>
					</Ficha>
				))}
				{semFoto ? (
					<span aria-current="true" className={CLASSE_FICHA}>
						Sem foto
					</span>
				) : null}
			</nav>

			{visiveis.length === 0 ? (
				<EmptyState
					titulo={
						filtrando
							? "Nenhum produto encontrado"
							: "Nenhum produto cadastrado"
					}
				>
					{filtrando ? (
						<Link
							to="/admin/produtos"
							className="font-semibold text-brand underline underline-offset-4"
						>
							Limpar filtros
						</Link>
					) : (
						"Use “Novo produto” para começar o catálogo."
					)}
				</EmptyState>
			) : (
				<ItemList
					rotulo="Produtos"
					colunas="2.75rem minmax(0,1.5fr) minmax(0,1fr) 5.5rem"
					cabecalho={["", "Nome", "Família", ""]}
				>
					{visiveis.map((produto) => (
						<ItemRow
							key={produto.slug}
							midia={<Miniatura src={produto.image} />}
							titulo={produto.name}
							detalhes={[
								nomeDaFamilia.get(produto.familySlug) ?? produto.familySlug,
							]}
							acoes={
								<>
									<Button
										variant="ghost"
										size="icon"
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
										size="icon"
										aria-label={`Remover ${produto.name}`}
										onClick={() =>
											setRemocao({ slug: produto.slug, name: produto.name })
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
				<ProductDialog
					aberto
					aoFechar={() => setDialogo({ aberto: false })}
					inicial={dialogo.inicial}
					familiaSugerida={familiaAtiva?.slug}
					familias={familias.data}
					enviando={criar.isPending || atualizar.isPending}
					erro={erro}
					aoSalvar={salvar}
				/>
			) : null}

			<ConfirmDialog
				aberto={remocao !== null}
				titulo={`Remover “${remocao?.name ?? ""}”?`}
				descricao="O produto sai do catálogo e do site. Esta ação não pode ser desfeita."
				aoCancelar={() => setRemocao(null)}
				aoConfirmar={() => {
					if (remocao) remover.mutate({ slug: remocao.slug });
					setRemocao(null);
				}}
			/>
		</>
	);
}
