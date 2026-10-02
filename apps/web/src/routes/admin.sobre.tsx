import type { AboutContent } from "@my-better-t-app/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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

export const Route = createFileRoute("/admin/sobre")({
	component: Sobre,
});

function Sobre() {
	const trpc = useTRPC();
	const conteudo = useQuery(trpc.conteudo.obter.queryOptions());

	if (conteudo.isPending) return <RouteLoader />;
	if (conteudo.isError) return <LoadError mensagem={conteudo.error.message} />;

	return <Formulario inicial={conteudo.data.about} />;
}

function Formulario({ inicial }: { inicial: AboutContent }) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const form = useDocumentForm(inicial);
	const [erro, setErro] = useState<string | null>(null);
	const dados = form.rascunho;

	const salvar = useMutation(
		trpc.conteudo.salvarSobre.mutationOptions({
			onSuccess: async (salvo) => {
				form.aceitar(salvo);
				await queryClient.invalidateQueries();
				toast.success("Página Sobre salva. Já vale no site.");
			},
			onError: (e) => setErro(e.message),
		}),
	);

	return (
		<form
			className="max-w-3xl"
			onSubmit={(evento) => {
				evento.preventDefault();
				setErro(null);
				salvar.mutate({
					...dados,
					story: [...dados.story],
					timeline: dados.timeline.map((marco) => ({ ...marco })),
				});
			}}
		>
			<PageHeading
				title="Sobre nós"
				description="A história da empresa e a linha do tempo."
			/>

			<div className="flex flex-col gap-4">
				<FormSection
					titulo="Abertura"
					ajuda="A frase logo abaixo do título da página."
					onde="topo da página"
				>
					<TextField
						rotulo="Subtítulo"
						valor={dados.intro}
						aoMudar={(intro) => form.mudar((atual) => ({ ...atual, intro }))}
					/>
				</FormSection>

				<FormSection
					titulo="História"
					ajuda="Um parágrafo por campo, na ordem em que aparecem."
					onde="ao lado das fotos"
				>
					<EditableList
						nomeDoItem="parágrafo"
						itens={dados.story}
						aoMudar={(story) => form.mudar((atual) => ({ ...atual, story }))}
						novoItem={() => ""}
						textoAdicionar="Adicionar parágrafo"
					>
						{(paragrafo, mudar, indice) => (
							<TextField
								rotulo={`Texto do parágrafo ${indice + 1}`}
								linhas={4}
								valor={paragrafo}
								aoMudar={mudar}
							/>
						)}
					</EditableList>
				</FormSection>

				<FormSection
					titulo="Linha do tempo"
					ajuda="Os marcos da empresa, do mais antigo ao mais recente. O último aparece em destaque."
					onde="fim da página"
				>
					<TextField
						rotulo="Título da seção"
						valor={dados.timelineTitle}
						aoMudar={(timelineTitle) =>
							form.mudar((atual) => ({ ...atual, timelineTitle }))
						}
					/>
					<EditableList
						nomeDoItem="marco"
						itens={dados.timeline}
						aoMudar={(timeline) =>
							form.mudar((atual) => ({ ...atual, timeline }))
						}
						novoItem={() => ({ year: "", title: "", text: "" })}
						textoAdicionar="Adicionar marco"
					>
						{(marco, mudar) => (
							<>
								<div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
									<TextField
										rotulo="Ano"
										valor={marco.year}
										aoMudar={(year) => mudar({ ...marco, year })}
										placeholder="1980"
									/>
									<TextField
										rotulo="Título"
										valor={marco.title}
										aoMudar={(title) => mudar({ ...marco, title })}
									/>
								</div>
								<TextField
									rotulo="Texto"
									linhas={2}
									valor={marco.text}
									aoMudar={(text) => mudar({ ...marco, text })}
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
