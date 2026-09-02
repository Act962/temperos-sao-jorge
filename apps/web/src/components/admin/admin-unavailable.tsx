import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/layout/brand-logo";

/**
 * O painel quando a API não responde.
 *
 * Acontece em ambiente sem banco — uma pré-visualização para validação, por
 * exemplo. Sem isto, a tela de acesso aparece normalmente e só falha depois que
 * a pessoa digita a senha e recebe um erro cru, o que parece defeito do site em
 * vez de ambiente incompleto.
 */
export function AdminUnavailable() {
	return (
		<div className="flex min-h-svh items-center justify-center bg-cream-sunken px-5 py-12">
			<div className="w-full max-w-sm">
				<div className="mb-8 flex justify-center">
					<BrandLogo className="h-14" />
				</div>

				<div className="rounded-lg border border-brand/12 bg-cream-raised p-7 shadow-[0_4px_14px_rgba(43,33,28,0.06)]">
					<h1 className="font-display font-extrabold text-[1.75rem] text-ink uppercase leading-none">
						Administração indisponível
					</h1>
					<p className="mt-3 font-sans text-ink-muted text-sm">
						Este ambiente está publicado sem banco de dados, então o painel não
						abre aqui. O site continua funcionando normalmente.
					</p>

					<Link
						to="/"
						className="mt-6 inline-flex font-sans font-semibold text-brand text-sm underline underline-offset-4"
					>
						Voltar para o site
					</Link>
				</div>
			</div>
		</div>
	);
}
