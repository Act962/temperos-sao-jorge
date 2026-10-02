import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Boxes, ChevronRight, CookingPot, Layers } from "lucide-react";
import { type ComponentType, type ReactNode, useId } from "react";
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
	const idRotulo = useId();

	return (
		// Sem o grupo rotulado, o número e a palavra são dois textos soltos: quem
		// usa leitor de tela ouve "105" e "Produtos" sem nada ligando os dois.
		// biome-ignore lint/a11y/useSemanticElements: fieldset é agrupamento de campos de formulário; aqui não há campo nenhum, só um número com rótulo.
		<div
			role="group"
			aria-labelledby={idRotulo}
			className="rounded-lg border border-brand/12 bg-cream-raised p-3.5 sm:p-5"
		>
			<div className="mb-3 hidden size-10 items-center justify-center rounded-full bg-brand/8 text-brand sm:flex">
				<Icone aria-hidden className="size-5" />
			</div>
			<p className="font-display font-extrabold text-[1.75rem] text-ink tabular-nums leading-none sm:text-[2rem]">
				{valor}
			</p>
			<p id={idRotulo} className="mt-1 font-sans text-ink-muted text-sm">
				{rotulo}
			</p>
		</div>
	);
}

function Pendencia({ children }: { children: ReactNode }) {
	return (
		<li className="flex items-center gap-3 py-2.5 font-sans text-ink text-sm">
			<span
				aria-hidden="true"
				className="size-2 shrink-0 rounded-full bg-[#c98a00]"
			/>
			{children}
		</li>
	);
}

const CLASSE_ATALHO =
	"ml-auto flex min-h-9 shrink-0 items-center gap-0.5 rounded-md px-2 font-semibold text-brand text-[0.8125rem] hover:bg-brand/8";

function VisaoGeral() {
	const trpc = useTRPC();
	const resumo = useQuery(trpc.catalog.resumo.queryOptions());
	const conteudo = useQuery(trpc.conteudo.obter.queryOptions());

	if (resumo.isPending || conteudo.isPending) return <RouteLoader />;

	if (resumo.isError) {
		return (
			<p role="alert" className="font-sans text-brand text-sm">
				Não foi possível carregar o resumo: {resumo.error.message}
			</p>
		);
	}

	if (conteudo.isError) {
		return (
			<p role="alert" className="font-sans text-brand text-sm">
				Não foi possível carregar o resumo: {conteudo.error.message}
			</p>
		);
	}

	const dados = resumo.data;
	// Enquanto ninguém marca o endereço como conferido, os dados de contato
	// são tratados como os de exemplo do design — e o site não os informa ao
	// Google.
	const contatoPorConferir = !conteudo.data.settings.contact.hasVerifiedAddress;
	const temPendencia =
		contatoPorConferir ||
		dados.produtosSemFoto > 0 ||
		dados.receitasSemFoto > 0;

	return (
		<div className="max-w-4xl">
			<PageHeading
				title="Visão geral"
				description="O catálogo do site, em números."
			/>

			<div className="grid grid-cols-3 gap-2.5 sm:gap-4">
				<Cartao icone={Boxes} rotulo="Produtos" valor={dados.produtos} />
				<Cartao icone={Layers} rotulo="Famílias" valor={dados.familias} />
				<Cartao icone={CookingPot} rotulo="Receitas" valor={dados.receitas} />
			</div>

			<section
				aria-labelledby="pendencias"
				className="mt-5 rounded-lg border border-brand/12 bg-cream-raised px-4 py-4 sm:px-5"
			>
				<h2 id="pendencias" className="font-sans font-semibold text-ink">
					O que falta no site
				</h2>
				{temPendencia ? (
					<ul className="mt-1.5 divide-y divide-brand/12">
						{contatoPorConferir ? (
							<Pendencia>
								<span>
									Telefone e endereço ainda não foram conferidos
									<span className="block text-ink-faint text-xs">
										{conteudo.data.settings.contact.phone} ·{" "}
										{conteudo.data.settings.contact.street}
									</span>
								</span>
								<Link to="/admin/configuracoes" className={CLASSE_ATALHO}>
									Conferir
									<ChevronRight aria-hidden="true" className="size-4" />
								</Link>
							</Pendencia>
						) : null}
						{dados.produtosSemFoto > 0 ? (
							<Pendencia>
								<span>
									{dados.produtosSemFoto === 1
										? "1 produto sem foto"
										: `${dados.produtosSemFoto} produtos sem foto`}
								</span>
								<Link
									to="/admin/produtos"
									search={{ semFoto: true }}
									className={CLASSE_ATALHO}
								>
									Ver
									<ChevronRight aria-hidden="true" className="size-4" />
								</Link>
							</Pendencia>
						) : null}
						{dados.receitasSemFoto > 0 ? (
							<Pendencia>
								<span>
									{dados.receitasSemFoto === 1
										? "1 receita sem foto"
										: `${dados.receitasSemFoto} receitas sem foto`}
								</span>
								<Link to="/admin/receitas" className={CLASSE_ATALHO}>
									Ver
									<ChevronRight aria-hidden="true" className="size-4" />
								</Link>
							</Pendencia>
						) : null}
					</ul>
				) : (
					<p className="mt-1.5 font-sans text-ink-muted text-sm">
						Nada pendente: contato conferido, e todo produto e toda receita têm
						foto cadastrada.
					</p>
				)}
			</section>

			<section className="mt-8">
				<h2 className="mb-3 font-sans font-semibold text-ink">
					Produtos por família
				</h2>
				<ul className="grid gap-2 sm:grid-cols-2">
					{dados.porFamilia.map((familia) => (
						<li key={familia.slug}>
							<Link
								to="/admin/produtos"
								search={{ familia: familia.slug }}
								className="flex min-h-11 items-center justify-between rounded-md border border-brand/12 bg-cream-raised px-4 font-sans text-sm transition-colors hover:border-brand/30"
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
		</div>
	);
}
