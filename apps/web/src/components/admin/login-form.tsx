import { Button } from "@my-better-t-app/ui/components/button";
import { Input } from "@my-better-t-app/ui/components/input";
import { Label } from "@my-better-t-app/ui/components/label";
import { useRouter } from "@tanstack/react-router";
import { useId, useState } from "react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { authClient } from "@/lib/auth-client";

/** Acesso ao painel. Ocupa o lugar do conteúdo enquanto não há sessão. */
export function LoginForm() {
	const router = useRouter();
	const emailId = useId();
	const senhaId = useId();

	const [enviando, setEnviando] = useState(false);
	const [erro, setErro] = useState<string | null>(null);

	const entrar = async (evento: React.FormEvent<HTMLFormElement>) => {
		evento.preventDefault();
		const dados = new FormData(evento.currentTarget);

		setEnviando(true);
		setErro(null);

		const { error } = await authClient.signIn.email({
			email: String(dados.get("email")),
			password: String(dados.get("password")),
		});

		setEnviando(false);

		if (error) {
			// A mensagem do Better-Auth vem em inglês e cita "credentials".
			setErro("E-mail ou senha incorretos.");
			return;
		}

		await router.invalidate();
	};

	return (
		<div className="flex min-h-svh items-center justify-center bg-cream-sunken px-5 py-12">
			<div className="w-full max-w-sm">
				<div className="mb-8 flex justify-center">
					<BrandLogo className="h-14" />
				</div>

				<form
					onSubmit={entrar}
					className="flex flex-col gap-5 rounded-lg border border-brand/12 bg-cream-raised p-7 shadow-[0_4px_14px_rgba(43,33,28,0.06)]"
				>
					<div>
						<h1 className="font-display font-extrabold text-[1.75rem] text-ink uppercase leading-none">
							Administração
						</h1>
						<p className="mt-2 font-sans text-ink-muted text-sm">
							Entre para gerenciar produtos e receitas.
						</p>
					</div>

					<div className="flex flex-col gap-1.5">
						<Label htmlFor={emailId}>E-mail</Label>
						<Input
							id={emailId}
							name="email"
							type="email"
							required
							autoComplete="email"
							placeholder="voce@alimentossaojorge.com"
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<Label htmlFor={senhaId}>Senha</Label>
						<Input
							id={senhaId}
							name="password"
							type="password"
							required
							autoComplete="current-password"
						/>
					</div>

					{erro ? (
						<p role="alert" className="font-sans text-brand text-sm">
							{erro}
						</p>
					) : null}

					<Button type="submit" disabled={enviando} className="w-full">
						{enviando ? "Entrando…" : "Entrar"}
					</Button>
				</form>
			</div>
		</div>
	);
}
