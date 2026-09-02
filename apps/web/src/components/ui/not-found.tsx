import { BrandLink } from "@/components/ui/brand-button";

/** Site-wide 404 screen. */
export function NotFound() {
	return (
		<div className="bg-cream py-28">
			<div className="shell-narrow text-center">
				<p className="font-display font-extrabold text-6xl text-brand/30">
					404
				</p>
				<h1 className="mt-3 font-display font-extrabold text-[2.25rem] text-ink uppercase leading-tight">
					Página não encontrada
				</h1>
				<p className="mx-auto mt-3.5 max-w-md font-sans text-base text-ink-muted leading-relaxed">
					O endereço que você acessou não existe ou foi movido. Aproveite para
					conhecer nossos produtos e receitas.
				</p>
				<div className="mt-7 flex flex-wrap justify-center gap-3">
					<BrandLink to="/">Voltar ao início</BrandLink>
					<BrandLink to="/produtos" variant="outline">
						Ver produtos
					</BrandLink>
				</div>
			</div>
		</div>
	);
}
