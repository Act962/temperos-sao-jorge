import type { LegalDocument } from "@my-better-t-app/core";
import { Button } from "@my-better-t-app/ui/components/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
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

interface LegalEditorProps {
	documento: "privacy" | "cookies";
	titulo: string;
	/** Endereço da página no site, para o texto de ajuda. */
	caminho: string;
}

/**
 * Editor das políticas — a de privacidade e a de cookies têm a mesma forma.
 *
 * Cada seção tem um título opcional, parágrafos e, quando for o caso, quadros
 * com título e texto (os "tipos de cookies"). Os parágrafos ficam num campo
 * só, separados por uma linha em branco: é como se escreve um texto corrido,
 * e uma lista de campos por parágrafo dobraria o tamanho de uma tela já longa.
 */
export function LegalEditor({ documento, titulo, caminho }: LegalEditorProps) {
	const trpc = useTRPC();
	const conteudo = useQuery(trpc.conteudo.obter.queryOptions());

	if (conteudo.isPending) return <RouteLoader />;
	if (conteudo.isError) return <LoadError mensagem={conteudo.error.message} />;

	return (
		<Formulario
			// As duas políticas usam este componente: a chave garante um
			// formulário novo ao trocar de uma para a outra.
			key={documento}
			documento={documento}
			titulo={titulo}
			caminho={caminho}
			inicial={conteudo.data[documento]}
		/>
	);
}

const SEPARADOR = /\n\s*\n/;

function Formulario({
	documento,
	titulo,
	caminho,
	inicial,
}: LegalEditorProps & { inicial: LegalDocument }) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const form = useDocumentForm(inicial);
	const [erro, setErro] = useState<string | null>(null);
	const dados = form.rascunho;

	const salvar = useMutation(
		trpc.conteudo.salvarLegal.mutationOptions({
			onSuccess: async (salvo) => {
				form.aceitar(salvo);
				await queryClient.invalidateQueries();
				toast.success(`${titulo} salva. Já vale no site.`);
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
					documento,
					dados: {
						...dados,
						sections: dados.sections.map((secao) => ({
							heading: secao.heading,
							paragraphs: [...secao.paragraphs],
							cards: secao.cards.map((cartao) => ({ ...cartao })),
						})),
					},
				});
			}}
		>
			<PageHeading
				title={titulo}
				description={`O texto publicado em ${caminho}.`}
			/>

			<div className="flex flex-col gap-4">
				<FormSection titulo="Cabeçalho" onde="topo da página">
					<TextField
						rotulo="Título do documento"
						valor={dados.title}
						aoMudar={(title) => form.mudar((atual) => ({ ...atual, title }))}
					/>
					<TextField
						rotulo="Última atualização"
						valor={dados.updatedAt}
						aoMudar={(updatedAt) =>
							form.mudar((atual) => ({ ...atual, updatedAt }))
						}
						placeholder="janeiro de 2026"
						ajuda="Aparece logo abaixo do título. Atualize sempre que o texto mudar."
					/>
					<TextField
						rotulo="Resumo"
						linhas={2}
						valor={dados.summary}
						aoMudar={(summary) =>
							form.mudar((atual) => ({ ...atual, summary }))
						}
						ajuda="Não aparece na página: é a descrição que os buscadores mostram."
					/>
				</FormSection>

				<FormSection
					titulo="Seções"
					ajuda="Na ordem em que aparecem. A primeira costuma ser a introdução, sem título."
				>
					<EditableList
						nomeDoItem="seção"
						itens={dados.sections}
						aoMudar={(sections) =>
							form.mudar((atual) => ({ ...atual, sections }))
						}
						novoItem={() => ({ heading: "", paragraphs: [""], cards: [] })}
						textoAdicionar="Adicionar seção"
					>
						{(secao, mudar) => (
							<>
								<TextField
									rotulo="Título da seção"
									valor={secao.heading}
									aoMudar={(heading) => mudar({ ...secao, heading })}
									placeholder="Deixe em branco na introdução"
								/>
								<TextField
									rotulo="Texto"
									linhas={5}
									// A linha em branco no fim é preservada enquanto a pessoa
									// digita; o domínio descarta os parágrafos vazios ao salvar.
									valor={secao.paragraphs.join("\n\n")}
									aoMudar={(texto) =>
										mudar({ ...secao, paragraphs: texto.split(SEPARADOR) })
									}
									ajuda="Separe os parágrafos com uma linha em branco."
								/>

								{secao.cards.length > 0 ? (
									<ul className="flex flex-col gap-3">
										{secao.cards.map((cartao, indice) => (
											<li
												// Quadros novos nascem em branco; a posição desempata.
												key={indice}
												className="rounded-md border border-brand/12 bg-cream-raised p-3"
											>
												<div className="mb-2 flex items-center justify-between">
													<span className="font-sans font-semibold text-ink-faint text-xs uppercase tracking-[0.08em]">
														Quadro {indice + 1}
													</span>
													<Button
														type="button"
														variant="ghost"
														size="icon"
														aria-label={`Remover quadro ${indice + 1}`}
														onClick={() =>
															mudar({
																...secao,
																cards: secao.cards.filter(
																	(_, outro) => outro !== indice,
																),
															})
														}
													>
														<X aria-hidden="true" />
													</Button>
												</div>
												<div className="flex flex-col gap-3">
													<TextField
														rotulo="Título do quadro"
														valor={cartao.title}
														aoMudar={(title) =>
															mudar({
																...secao,
																cards: secao.cards.map((item, outro) =>
																	outro === indice ? { ...item, title } : item,
																),
															})
														}
													/>
													<TextField
														rotulo="Texto do quadro"
														linhas={2}
														valor={cartao.text}
														aoMudar={(text) =>
															mudar({
																...secao,
																cards: secao.cards.map((item, outro) =>
																	outro === indice ? { ...item, text } : item,
																),
															})
														}
													/>
												</div>
											</li>
										))}
									</ul>
								) : null}

								<div>
									<Button
										type="button"
										variant="ghost"
										onClick={() =>
											mudar({
												...secao,
												cards: [...secao.cards, { title: "", text: "" }],
											})
										}
									>
										<Plus aria-hidden="true" />
										Adicionar quadro
									</Button>
								</div>
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
