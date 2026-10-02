import {
	REDES_SOCIAIS,
	type RedeSocial,
	type SiteSettings,
} from "@my-better-t-app/core";
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
import { socialName } from "@/lib/site-content";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/admin/configuracoes")({
	component: Configuracoes,
});

function Configuracoes() {
	const trpc = useTRPC();
	const conteudo = useQuery(trpc.conteudo.obter.queryOptions());

	if (conteudo.isPending) return <RouteLoader />;
	if (conteudo.isError) return <LoadError mensagem={conteudo.error.message} />;

	return <Formulario inicial={conteudo.data.settings} />;
}

function Formulario({ inicial }: { inicial: SiteSettings }) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const idConferido = useId();
	const form = useDocumentForm(inicial);
	const [erro, setErro] = useState<string | null>(null);
	const dados = form.rascunho;

	const salvar = useMutation(
		trpc.conteudo.salvarConfiguracoes.mutationOptions({
			onSuccess: async (salvo) => {
				form.aceitar(salvo);
				await queryClient.invalidateQueries();
				toast.success("Configurações salvas. Já valem no site.");
			},
			// As regras são do domínio — e-mail, telefone, link de rede social —,
			// e a mensagem dele aparece junto do botão de salvar.
			onError: (e) => setErro(e.message),
		}),
	);

	const mudarContato = (
		campo: keyof SiteSettings["contact"],
		valor: string | boolean,
	) =>
		form.mudar((atual) => ({
			...atual,
			contact: { ...atual.contact, [campo]: valor },
		}));

	// Só oferece para adicionar as redes que ainda não estão na lista: o
	// domínio recusa a mesma rede duas vezes.
	const redesLivres = REDES_SOCIAIS.filter(
		(rede) => !dados.social.some((item) => item.platform === rede),
	);

	return (
		<form
			className="max-w-3xl"
			onSubmit={(evento) => {
				evento.preventDefault();
				setErro(null);
				salvar.mutate({
					...dados,
					social: [...dados.social],
					contactSubjects: [...dados.contactSubjects],
				});
			}}
		>
			<PageHeading
				title="Configurações"
				description="Os dados da empresa usados no rodapé, na página Contato e nos buscadores."
			/>

			<div className="flex flex-col gap-4">
				<FormSection
					titulo="Contato"
					ajuda="Telefone, e-mail e endereço."
					onde="rodapé e Contato"
				>
					<div className="grid gap-4 sm:grid-cols-2">
						<TextField
							rotulo="Telefone"
							tipo="tel"
							valor={dados.contact.phone}
							aoMudar={(valor) => mudarContato("phone", valor)}
							placeholder="(11) 3000-0000"
						/>
						<TextField
							rotulo="E-mail"
							tipo="email"
							valor={dados.contact.email}
							aoMudar={(valor) => mudarContato("email", valor)}
						/>
						<TextField
							rotulo="Rua e número"
							valor={dados.contact.street}
							aoMudar={(valor) => mudarContato("street", valor)}
						/>
						<TextField
							rotulo="Bairro"
							valor={dados.contact.district}
							aoMudar={(valor) => mudarContato("district", valor)}
						/>
						<TextField
							rotulo="Cidade"
							valor={dados.contact.city}
							aoMudar={(valor) => mudarContato("city", valor)}
						/>
						<div className="grid grid-cols-[5rem_1fr] gap-4">
							<TextField
								rotulo="UF"
								valor={dados.contact.state}
								aoMudar={(valor) => mudarContato("state", valor)}
								placeholder="SP"
							/>
							<TextField
								rotulo="CEP"
								valor={dados.contact.postalCode}
								aoMudar={(valor) => mudarContato("postalCode", valor)}
							/>
						</div>
					</div>

					<TextField
						rotulo="Horário de atendimento"
						valor={dados.contact.openingHours}
						aoMudar={(valor) => mudarContato("openingHours", valor)}
						placeholder="Segunda a sexta, 8h às 17h"
					/>

					<div className="flex items-start gap-2.5 rounded-md bg-brand/5 p-3">
						<input
							id={idConferido}
							type="checkbox"
							checked={dados.contact.hasVerifiedAddress}
							onChange={(evento) =>
								mudarContato("hasVerifiedAddress", evento.target.checked)
							}
							className="mt-0.5 size-5 shrink-0 accent-brand"
						/>
						<div>
							<Label htmlFor={idConferido}>
								O endereço acima é o verdadeiro
							</Label>
							<p className="mt-1 font-sans text-ink-faint text-xs">
								Só com isto marcado o site informa o endereço ao Google. Deixe
								desmarcado enquanto ele for o de exemplo.
							</p>
						</div>
					</div>
				</FormSection>

				<FormSection
					titulo="WhatsApp"
					ajuda="Deixe o número em branco para esconder o botão do site."
					onde="cabeçalho e rodapé"
				>
					<div className="grid gap-4 sm:grid-cols-2">
						<TextField
							rotulo="Número do WhatsApp"
							tipo="tel"
							valor={dados.whatsapp.number}
							aoMudar={(number) =>
								form.mudar((atual) => ({
									...atual,
									whatsapp: { ...atual.whatsapp, number },
								}))
							}
							placeholder="(11) 99999-0000"
							ajuda="Com DDD. O 55 do Brasil entra sozinho."
						/>
						<TextField
							rotulo="Mensagem inicial"
							valor={dados.whatsapp.message}
							aoMudar={(message) =>
								form.mudar((atual) => ({
									...atual,
									whatsapp: { ...atual.whatsapp, message },
								}))
							}
							ajuda="Já vem escrita quando a pessoa abre a conversa."
						/>
					</div>
				</FormSection>

				<FormSection
					titulo="Redes sociais"
					ajuda="Só perfis que existem: cole o endereço completo do perfil."
					onde="rodapé"
				>
					{dados.social.length === 0 ? (
						<p className="font-sans text-ink-faint text-sm">
							Nenhuma rede cadastrada. O rodapé fica sem os ícones.
						</p>
					) : null}

					{dados.social.map((rede) => (
						<div key={rede.platform} className="flex items-end gap-2">
							<div className="min-w-0 flex-1">
								<TextField
									rotulo={socialName(rede.platform)}
									tipo="url"
									valor={rede.href}
									placeholder="https://"
									aoMudar={(href) =>
										form.mudar((atual) => ({
											...atual,
											social: atual.social.map((item) =>
												item.platform === rede.platform
													? { ...item, href }
													: item,
											),
										}))
									}
								/>
							</div>
							<button
								type="button"
								className="min-h-10 shrink-0 rounded-md px-3 font-sans font-semibold text-[0.8125rem] text-brand hover:bg-brand/8 max-md:min-h-11"
								onClick={() =>
									form.mudar((atual) => ({
										...atual,
										social: atual.social.filter(
											(item) => item.platform !== rede.platform,
										),
									}))
								}
							>
								Remover
								<span className="sr-only"> {socialName(rede.platform)}</span>
							</button>
						</div>
					))}

					{redesLivres.length > 0 ? (
						<div className="flex flex-wrap gap-2">
							{redesLivres.map((rede: RedeSocial) => (
								<button
									key={rede}
									type="button"
									className="min-h-10 rounded-md border border-brand/25 border-dashed px-3 font-sans font-semibold text-[0.8125rem] text-ink-soft hover:border-brand hover:text-brand max-md:min-h-11"
									onClick={() =>
										form.mudar((atual) => ({
											...atual,
											social: [...atual.social, { platform: rede, href: "" }],
										}))
									}
								>
									+ {socialName(rede)}
								</button>
							))}
						</div>
					) : null}
				</FormSection>

				<FormSection
					titulo="Assuntos do formulário"
					ajuda="As opções que o visitante escolhe em “Como podemos ajudar?”."
					onde="página Contato"
				>
					<EditableList
						nomeDoItem="assunto"
						itens={dados.contactSubjects}
						aoMudar={(contactSubjects) =>
							form.mudar((atual) => ({ ...atual, contactSubjects }))
						}
						novoItem={() => ""}
						textoAdicionar="Adicionar assunto"
					>
						{(assunto, mudar, indice) => (
							<TextField
								rotulo={`Texto do assunto ${indice + 1}`}
								valor={assunto}
								aoMudar={mudar}
							/>
						)}
					</EditableList>
				</FormSection>

				<FormSection
					titulo="Descrição da empresa"
					ajuda="Uma ou duas frases. É o que o Google usa para apresentar a marca."
					onde="buscadores"
				>
					<TextField
						rotulo="Descrição"
						linhas={3}
						valor={dados.description}
						aoMudar={(description) =>
							form.mudar((atual) => ({ ...atual, description }))
						}
					/>
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
