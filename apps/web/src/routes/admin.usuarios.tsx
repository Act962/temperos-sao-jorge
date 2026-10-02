import { Badge } from "@my-better-t-app/ui/components/badge";
import { Button } from "@my-better-t-app/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@my-better-t-app/ui/components/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { LoadError, TextField } from "@/components/admin/form-kit";
import { ItemList, ItemRow } from "@/components/admin/item-list";
import { PageHeading } from "@/components/admin/page-heading";
import { RouteLoader } from "@/components/ui/route-loader";
import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/admin/usuarios")({
	component: Usuarios,
});

interface Usuario {
	id: string;
	name: string;
}

const CLASSE_DIALOGO =
	"max-h-[calc(100svh-2rem)] overflow-y-auto p-5 sm:max-w-md";
const CLASSE_TITULO = "font-sans font-semibold text-base text-ink";
const CLASSE_DESCRICAO = "font-sans text-ink-muted text-sm";

function Erro({ mensagem }: { mensagem: string | null }) {
	if (!mensagem) return null;
	return (
		<p role="alert" className="font-sans text-brand text-sm">
			{mensagem}
		</p>
	);
}

/**
 * Criação de usuário.
 *
 * Quem cria define a senha e a entrega à pessoa: o projeto não envia e-mail,
 * então não há convite nem link de primeiro acesso. A pessoa troca a senha
 * depois, nesta mesma tela.
 */
function NovoUsuario({ aoFechar }: { aoFechar: () => void }) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const [dados, setDados] = useState({ name: "", email: "", password: "" });
	const [erro, setErro] = useState<string | null>(null);

	const criar = useMutation(
		trpc.usuarios.criar.mutationOptions({
			onSuccess: async (usuario) => {
				await queryClient.invalidateQueries();
				toast.success(`Acesso criado para ${usuario.name}.`);
				aoFechar();
			},
			// Senha curta e e-mail repetido são regras do domínio.
			onError: (e) => setErro(e.message),
		}),
	);

	return (
		<Dialog open onOpenChange={(estado) => !estado && aoFechar()}>
			<DialogContent className={CLASSE_DIALOGO}>
				<form
					onSubmit={(evento) => {
						evento.preventDefault();
						setErro(null);
						criar.mutate(dados);
					}}
				>
					<DialogHeader>
						<DialogTitle className={CLASSE_TITULO}>Novo usuário</DialogTitle>
						<DialogDescription className={CLASSE_DESCRICAO}>
							Ele entra com o e-mail e a senha que você definir aqui, e pode
							editar tudo no painel.
						</DialogDescription>
					</DialogHeader>

					<div className="my-5 flex flex-col gap-4">
						<TextField
							rotulo="Nome"
							valor={dados.name}
							aoMudar={(name) => setDados((atual) => ({ ...atual, name }))}
							obrigatorio
						/>
						<TextField
							rotulo="E-mail"
							tipo="email"
							valor={dados.email}
							aoMudar={(email) => setDados((atual) => ({ ...atual, email }))}
							obrigatorio
						/>
						<TextField
							rotulo="Senha"
							tipo="password"
							autoComplete="new-password"
							valor={dados.password}
							aoMudar={(password) =>
								setDados((atual) => ({ ...atual, password }))
							}
							ajuda="Pelo menos 8 caracteres. Combine com a pessoa e peça para ela trocar depois."
							obrigatorio
						/>
						<Erro mensagem={erro} />
					</div>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={aoFechar}>
							Cancelar
						</Button>
						<Button type="submit" disabled={criar.isPending}>
							{criar.isPending ? "Criando…" : "Criar acesso"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

/** Troca da própria senha. Quem valida a senha atual é o Better-Auth. */
function TrocarSenha({ aoFechar }: { aoFechar: () => void }) {
	const [atual, setAtual] = useState("");
	const [nova, setNova] = useState("");
	const [enviando, setEnviando] = useState(false);
	const [erro, setErro] = useState<string | null>(null);

	const trocar = async () => {
		setEnviando(true);
		setErro(null);

		const { error } = await authClient.changePassword({
			currentPassword: atual,
			newPassword: nova,
			// Um celular esquecido ou um computador emprestado deixam de valer.
			revokeOtherSessions: true,
		});

		setEnviando(false);

		if (error) {
			// As mensagens do Better-Auth vêm em inglês.
			setErro(
				error.code === "INVALID_PASSWORD"
					? "A senha atual não confere."
					: error.code === "PASSWORD_TOO_SHORT"
						? "A senha nova precisa de pelo menos 8 caracteres."
						: "Não foi possível trocar a senha. Tente de novo.",
			);
			return;
		}

		toast.success("Senha trocada.");
		aoFechar();
	};

	return (
		<Dialog open onOpenChange={(estado) => !estado && aoFechar()}>
			<DialogContent className={CLASSE_DIALOGO}>
				<form
					onSubmit={(evento) => {
						evento.preventDefault();
						void trocar();
					}}
				>
					<DialogHeader>
						<DialogTitle className={CLASSE_TITULO}>
							Trocar minha senha
						</DialogTitle>
						<DialogDescription className={CLASSE_DESCRICAO}>
							Os outros aparelhos em que você entrou serão desconectados.
						</DialogDescription>
					</DialogHeader>

					<div className="my-5 flex flex-col gap-4">
						<TextField
							rotulo="Senha atual"
							tipo="password"
							autoComplete="current-password"
							valor={atual}
							aoMudar={setAtual}
							obrigatorio
						/>
						<TextField
							rotulo="Senha nova"
							tipo="password"
							autoComplete="new-password"
							valor={nova}
							aoMudar={setNova}
							ajuda="Pelo menos 8 caracteres."
							obrigatorio
						/>
						<Erro mensagem={erro} />
					</div>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={aoFechar}>
							Cancelar
						</Button>
						<Button type="submit" disabled={enviando}>
							{enviando ? "Trocando…" : "Trocar senha"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function Usuarios() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const [dialogo, setDialogo] = useState<"novo" | "senha" | null>(null);
	const [remocao, setRemocao] = useState<Usuario | null>(null);

	const consulta = useQuery(trpc.usuarios.listar.queryOptions());

	const remover = useMutation(
		trpc.usuarios.remover.mutationOptions({
			onSuccess: async () => {
				await queryClient.invalidateQueries();
				toast.success("Acesso removido.");
			},
			onError: (e) => toast.error(e.message),
		}),
	);

	if (consulta.isPending) return <RouteLoader />;
	if (consulta.isError) return <LoadError mensagem={consulta.error.message} />;

	const { usuarios, voce } = consulta.data;

	return (
		<div className="max-w-4xl">
			<PageHeading
				title="Usuários"
				description="Quem pode entrar no painel. Todos podem editar tudo."
				action={
					<Button onClick={() => setDialogo("novo")}>
						<Plus aria-hidden="true" />
						Novo usuário
					</Button>
				}
			/>

			<ItemList
				rotulo="Usuários"
				colunas="minmax(0,1fr) minmax(0,1.3fr) 3rem"
				cabecalho={["Nome", "E-mail", ""]}
			>
				{usuarios.map((usuario) => {
					const ehVoce = usuario.id === voce;
					return (
						<ItemRow
							key={usuario.id}
							titulo={
								<span className="flex flex-wrap items-center gap-2">
									{usuario.name}
									{ehVoce ? <Badge variant="secondary">você</Badge> : null}
								</span>
							}
							detalhes={[<span key="email">{usuario.email}</span>]}
							acoes={
								ehVoce ? (
									<Button
										variant="ghost"
										size="icon"
										aria-label="Trocar minha senha"
										onClick={() => setDialogo("senha")}
									>
										<KeyRound aria-hidden="true" />
									</Button>
								) : (
									<Button
										variant="ghost"
										size="icon"
										aria-label={`Remover ${usuario.name}`}
										onClick={() =>
											setRemocao({ id: usuario.id, name: usuario.name })
										}
									>
										<Trash2 aria-hidden="true" />
									</Button>
								)
							}
						/>
					);
				})}
			</ItemList>

			<p className="mt-3 font-sans text-ink-faint text-xs">
				Contas novas só nascem aqui: o cadastro pelo site fica fechado enquanto
				houver pelo menos um usuário.
			</p>

			{dialogo === "novo" ? (
				<NovoUsuario aoFechar={() => setDialogo(null)} />
			) : null}
			{dialogo === "senha" ? (
				<TrocarSenha aoFechar={() => setDialogo(null)} />
			) : null}

			<ConfirmDialog
				aberto={remocao !== null}
				titulo={`Remover o acesso de “${remocao?.name ?? ""}”?`}
				descricao="A pessoa é desconectada na hora e não consegue mais entrar no painel."
				aoCancelar={() => setRemocao(null)}
				aoConfirmar={() => {
					if (remocao) remover.mutate({ id: remocao.id });
					setRemocao(null);
				}}
			/>
		</div>
	);
}
