import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Boxes, CookingPot, Layers } from "lucide-react";
import type { ComponentType } from "react";
import { PageHeading } from "@/components/admin/page-heading";
import { RouteLoader } from "@/components/ui/route-loader";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/admin/")({
	component: VisaoGeral,
});

interface CartaoProps {
	icone: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
	rotulo: string;
	valor: number;
}

function Cartao({ icone: Icone, rotulo, valor }: CartaoProps) {
	return (
		<div className="rounded-lg border border-brand/12 bg-cream-raised p-5">
			<div className="mb-3 flex size-10 items-center justify-center rounded-full bg-brand/8 text-brand">
				<Icone aria-hidden className="size-5" />
			</div>
			<p className="font-display font-extrabold text-[2rem] text-ink tabular-nums leading-none">
				{valor}
			</p>
			<p className="mt-1 font-sans text-ink-muted text-sm">{rotulo}</p>
		</div>
	);
}

function VisaoGeral() {
	const trpc = useTRPC();
	const resumo = useQuery(trpc.catalog.resumo.queryOptions());

	if (resumo.isPending) return <RouteLoader />;

	if (resumo.isError) {
		return (
			<p role="alert" className="font-sans text-brand text-sm">
				Não foi possível carregar o resumo: {resumo.error.message}
			</p>
		);
	}

	const dados = resumo.data;

	return (
		<>
			<PageHeading
				title="Visão geral"
				description="O que está publicado hoje no catálogo."
			/>

			<div className="grid gap-4 sm:grid-cols-3">
				<Cartao icone={Boxes} rotulo="Produtos" valor={dados.produtos} />
				<Cartao icone={Layers} rotulo="Famílias" valor={dados.familias} />
				<Cartao icone={CookingPot} rotulo="Receitas" valor={dados.receitas} />
			</div>

			<section className="mt-10">
				<h2 className="mb-4 font-sans font-semibold text-ink">
					Produtos por família
				</h2>
				<ul className="grid gap-2 sm:grid-cols-2">
					{dados.porFamilia.map((familia) => (
						<li key={familia.slug}>
							<Link
								to="/admin/produtos"
								search={{ familia: familia.slug }}
								className="flex items-center justify-between rounded-md border border-brand/12 bg-cream-raised px-4 py-3 font-sans text-sm transition-colors hover:border-brand/30"
							>
								<span className="text-ink">{familia.name}</span>
								<span className="text-ink-faint tabular-nums">
									{familia.count}
								</span>
							</Link>
						</li>
					))}
				</ul>
			</section>
		</>
	);
}
