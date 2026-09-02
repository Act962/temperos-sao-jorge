import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeading } from "@/components/admin/page-heading";
import {
	type ReceitaFormulario,
	RecipeForm,
} from "@/components/admin/recipe-form";
import { RouteLoader } from "@/components/ui/route-loader";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/admin/receitas/$slug")({
	component: EditarReceita,
});

function EditarReceita() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { slug } = Route.useParams();
	const [erro, setErro] = useState<string | null>(null);

	const receita = useQuery(trpc.catalog.receitas.obter.queryOptions({ slug }));
	const produtos = useQuery(trpc.catalog.produtos.listar.queryOptions());

	const atualizar = useMutation(
		trpc.catalog.receitas.atualizar.mutationOptions({
			onSuccess: async (salva) => {
				await queryClient.invalidateQueries();
				toast.success(`"${salva.name}" atualizada.`);
			},
			onError: (e) => setErro(e.message),
		}),
	);

	if (receita.isPending || produtos.isPending) return <RouteLoader />;

	// Cada consulta é conferida em separado: o TypeScript só estreita a união do
	// React Query quando o teste é feito no próprio objeto.
	if (receita.isError) {
		return (
			<p role="alert" className="font-sans text-brand text-sm">
				{receita.error.message}
			</p>
		);
	}
	if (produtos.isError) {
		return (
			<p role="alert" className="font-sans text-brand text-sm">
				{produtos.error.message}
			</p>
		);
	}

	const atual = receita.data;

	const salvar = (dados: ReceitaFormulario) => {
		setErro(null);
		atualizar.mutate({
			slug: atual.slug,
			dados: {
				name: dados.name,
				summary: dados.summary,
				minutes: dados.minutes,
				level: dados.level,
				servings: dados.servings,
				category: dados.category,
				image: dados.image === "" ? null : dados.image,
				ingredients: dados.ingredients,
				steps: dados.steps,
				usedProductSlugs: dados.usedProductSlugs,
			},
		});
	};

	return (
		<>
			<PageHeading
				title={atual.name}
				description="As mudanças entram no site na próxima publicação."
			/>
			<RecipeForm
				// A receita carregada é o estado inicial do formulário. A chave força
				// remontar quando a rota troca de slug sem desmontar o componente.
				key={atual.slug}
				inicial={{
					slug: atual.slug,
					name: atual.name,
					summary: atual.summary,
					minutes: atual.minutes,
					level: atual.level,
					servings: atual.servings,
					category: atual.category,
					image: atual.image ?? "",
					ingredients: [...atual.ingredients],
					steps: [...atual.steps],
					usedProductSlugs: [...atual.usedProductSlugs],
				}}
				editando
				catalogo={produtos.data}
				enviando={atualizar.isPending}
				erro={erro}
				aoSalvar={salvar}
			/>
		</>
	);
}
