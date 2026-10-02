import type { HomeContent } from "@my-better-t-app/core";
import { Label } from "@my-better-t-app/ui/components/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useId, useState } from "react";
import { toast } from "sonner";
import {
	EditableList,
	FormSection,
	LoadError,
	SaveBar,
	TextField,
	useDocumentForm,
} from "@/components/admin/form-kit";
import { PageHeading } from "@/components/admin/page-heading";
import { RouteLoader } from "@/components/ui/route-loader";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/admin/inicio")({
	component: Inicio,
});

interface Familia {
	slug: string;
	name: string;
}

interface Produto {
	slug: string;
	name: string;
	familySlug: string;
}

function Inicio() {
	const trpc = useTRPC();
	const conteudo = useQuery(trpc.conteudo.obter.queryOptions());
	// Famílias e produtos alimentam a escolha do representante de cada família.
	const familias = useQuery(trpc.catalog.familias.listar.queryOptions());
	const produtos = useQuery(trpc.catalog.produtos.listar.queryOptions());

	if (conteudo.isPending || familias.isPending || produtos.isPending) {
		return <RouteLoader />;
	}

	// Cada consulta é conferida em separado: o TypeScript só estreita a união do
	// React Query quando o teste é feito no próprio objeto.
	if (conteudo.isError) return <LoadError mensagem={conteudo.error.message} />;
	if (familias.isError) return <LoadError mensagem={familias.error.message} />;
	if (produtos.isError) return <LoadError mensagem={produtos.error.message} />;

	return (
		<Formulario
			inicial={conteudo.data.home}
			familias={familias.data}
			produtos={produtos.data}
		/>
	);
}

interface RepresentanteProps {
	familia: Familia;
	produtos: readonly Produto[];
	escolhido: string;
	aoMudar: (slug: string) => void;
}

function Representante({
	familia,
	produtos,
	escolhido,
	aoMudar,
}: RepresentanteProps) {
	const id = useId();
	const daFamilia = produtos.filter((p) => p.familySlug === familia.slug);
	// O representante salvo pode ter sido removido do catálogo, ou movido para
	// outra família: nesse caso o site já usa o primeiro, e a tela mostra isso.
	const valor = daFamilia.some((p) => p.slug === escolhido) ? escolhido : "";

	return (
		<div className="flex flex-col gap-1.5">
			<Label htmlFor={id}>{familia.name}</Label>
			<select
				id={id}
				value={valor}
				disabled={daFamilia.length === 0}
				onChange={(evento) => aoMudar(evento.target.value)}
				className="border border-input px-3 font-sans"
			>
				<option value="">
					{daFamilia.length === 0
						? "Família sem produtos — não aparece na home"
						: "O primeiro produto da família"}
				</option>
				{daFamilia.map((produto) => (
					<option key={produto.slug} value={produto.slug}>
						{produto.name}
					</option>
				))}
			</select>
		</div>
	);
}

interface FormularioProps {
	inicial: HomeContent;
	familias: readonly Familia[];
	produtos: readonly Produto[];
}

function Formulario({ inicial, familias, produtos }: FormularioProps) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const form = useDocumentForm(inicial);
	const [erro, setErro] = useState<string | null>(null);
	const dados = form.rascunho;

	const salvar = useMutation(
		trpc.conteudo.salvarInicio.mutationOptions({
			onSuccess: async (salvo) => {
				form.aceitar(salvo);
				await queryClient.invalidateQueries();
				toast.success("Página inicial salva. Já vale no site.");
			},
			onError: (e) => setErro(e.message),
		}),
	);

	/** Altera um campo de uma das seções que são um objeto simples. */
	const mudarSecao = <S extends "hero" | "story" | "recipes">(
		secao: S,
		campo: keyof HomeContent[S],
		valor: string,
	) =>
		form.mudar((atual) => ({
			...atual,
			[secao]: { ...atual[secao], [campo]: valor },
		}));

	return (
		<form
			className="max-w-3xl"
			onSubmit={(evento) => {
				evento.preventDefault();
				setErro(null);
				salvar.mutate({
					...dados,
					families: {
						...dados.families,
						representatives: { ...dados.families.representatives },
					},
					values: dados.values.map((valor) => ({ ...valor })),
				});
			}}
		>
			<PageHeading
				title="Início"
				description="Os textos da página inicial, na ordem em que aparecem."
			/>

			<div className="flex flex-col gap-4">
				<FormSection
					titulo="Abertura"
					ajuda="A primeira coisa que o visitante vê, sobre a foto."
					onde="topo da página"
				>
					<TextField
						rotulo="Título"
						linhas={2}
						valor={dados.hero.title}
						aoMudar={(valor) => mudarSecao("hero", "title", valor)}
						ajuda="Cada linha aqui é uma linha no site. O ponto final vermelho entra sozinho."
					/>
					<TextField
						rotulo="Texto de apoio"
						linhas={2}
						valor={dados.hero.text}
						aoMudar={(valor) => mudarSecao("hero", "text", valor)}
					/>
					<TextField
						rotulo="Descrição da foto"
						valor={dados.hero.imageAlt}
						aoMudar={(valor) => mudarSecao("hero", "imageAlt", valor)}
						ajuda="Para quem usa leitor de tela e para os buscadores."
					/>
				</FormSection>

				<FormSection
					titulo="Nossa história"
					ajuda="Chamada para a página Sobre nós."
					onde="2ª seção"
				>
					<TextField
						rotulo="Título"
						valor={dados.story.title}
						aoMudar={(valor) => mudarSecao("story", "title", valor)}
					/>
					<TextField
						rotulo="Texto"
						linhas={3}
						valor={dados.story.text}
						aoMudar={(valor) => mudarSecao("story", "text", valor)}
					/>
					<TextField
						rotulo="Frase manuscrita"
						valor={dados.story.note}
						aoMudar={(valor) => mudarSecao("story", "note", valor)}
						ajuda="Aparece em letra de mão, ao lado da foto."
					/>
					<TextField
						rotulo="Descrição da foto"
						valor={dados.story.imageAlt}
						aoMudar={(valor) => mudarSecao("story", "imageAlt", valor)}
					/>
				</FormSection>

				<FormSection
					titulo="Famílias de produtos"
					ajuda="O título da faixa vermelha e o produto cuja foto representa cada família."
					onde="3ª seção"
				>
					<TextField
						rotulo="Título"
						linhas={2}
						valor={dados.families.title}
						aoMudar={(title) =>
							form.mudar((atual) => ({
								...atual,
								families: { ...atual.families, title },
							}))
						}
						ajuda="Cada linha aqui é uma linha no site."
					/>
					<div className="grid gap-4 sm:grid-cols-2">
						{familias.map((familia) => (
							<Representante
								key={familia.slug}
								familia={familia}
								produtos={produtos}
								escolhido={dados.families.representatives[familia.slug] ?? ""}
								aoMudar={(slug) =>
									form.mudar((atual) => ({
										...atual,
										families: {
											...atual.families,
											representatives: {
												...atual.families.representatives,
												[familia.slug]: slug,
											},
										},
									}))
								}
							/>
						))}
					</div>
				</FormSection>

				<FormSection
					titulo="Receitas"
					ajuda="O texto ao lado das três receitas em destaque."
					onde="4ª seção"
				>
					<TextField
						rotulo="Título"
						valor={dados.recipes.title}
						aoMudar={(valor) => mudarSecao("recipes", "title", valor)}
					/>
					<TextField
						rotulo="Texto"
						linhas={2}
						valor={dados.recipes.text}
						aoMudar={(valor) => mudarSecao("recipes", "text", valor)}
					/>
				</FormSection>

				<FormSection
					titulo="Compromissos da marca"
					ajuda="Sempre quatro, cada um com o seu ícone. Escreva {produtos} e {familias} onde quiser a contagem do catálogo, que se atualiza sozinha."
					onde="antes do rodapé"
				>
					<EditableList
						nomeDoItem="compromisso"
						itens={dados.values}
						aoMudar={(values) => form.mudar((atual) => ({ ...atual, values }))}
					>
						{(valor, mudar) => (
							<>
								<TextField
									rotulo="Título"
									valor={valor.title}
									aoMudar={(title) => mudar({ ...valor, title })}
								/>
								<TextField
									rotulo="Texto"
									linhas={2}
									valor={valor.text}
									aoMudar={(text) => mudar({ ...valor, text })}
								/>
							</>
						)}
					</EditableList>
				</FormSection>
			</div>

			<SaveBar
				sujo={form.sujo}
				enviando={salvar.isPending}
				erro={erro}
				aoDescartar={() => {
					setErro(null);
					form.descartar();
				}}
			/>
		</form>
	);
}
