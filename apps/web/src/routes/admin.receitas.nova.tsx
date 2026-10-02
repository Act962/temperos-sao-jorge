import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeading } from "@/components/admin/page-heading";
import { descartarFoto, resolverFoto } from "@/components/admin/photo";
import {
	RECEITA_VAZIA,
	type ReceitaFormulario,
	RecipeForm,
} from "@/components/admin/recipe-form";
import { RouteLoader } from "@/components/ui/route-loader";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/admin/receitas/nova")({
	component: NovaReceita,
});

function NovaReceita() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const [erro, setErro] = useState<string | null>(null);
	const [enviandoFoto, setEnviandoFoto] = useState(false);

	// O formulário precisa do catálogo para a busca de produtos citados.
	const produtos = useQuery(trpc.catalog.produtos.listar.queryOptions());

	const criar = useMutation(
		trpc.catalog.receitas.criar.mutationOptions({
			onSuccess: async (receita) => {
				await queryClient.invalidateQueries();
				toast.success(`"${receita.name}" criada.`);
				// Segue para a URL da própria receita em vez de voltar para a
				// lista: quem acabou de escrever quase sempre tem um ajuste em
				// seguida, e procurar a receita recém-criada entre as outras para
				// clicar em editar é trabalho que a tela pode poupar.
				//
				// `replace` porque esta tela cumpriu o papel dela: voltar cairia
				// num formulário de criação já enviado, que reenviaria em
				// conflito de slug.
				await navigate({
					to: "/admin/receitas/$slug",
					params: { slug: receita.slug },
					replace: true,
				});
			},
			onError: (e) => setErro(e.message),
		}),
	);

	if (produtos.isPending) return <RouteLoader />;
	if (produtos.isError) {
		return (
			<p role="alert" className="font-sans text-brand text-sm">
				{produtos.error.message}
			</p>
		);
	}

	const salvar = async (dados: ReceitaFormulario) => {
		setErro(null);

		// Primeiro a foto, depois a receita apontando para ela. Se a foto não
		// sobe, nada é gravado e o motivo aparece no fim do formulário.
		setEnviandoFoto(true);
		const foto = await resolverFoto(dados.foto, {
			alvo: "receita",
			nome: dados.slug,
		})
			.catch((falha: unknown) => {
				setErro(
					falha instanceof Error
						? falha.message
						: "Não foi possível enviar a foto.",
				);
				return null;
			})
			.finally(() => setEnviandoFoto(false));
		if (foto === null) return;

		criar.mutate(
			{
				slug: dados.slug,
				name: dados.name,
				summary: dados.summary,
				minutes: dados.minutes,
				level: dados.level,
				servings: dados.servings,
				category: dados.category,
				image: foto.image,
				ingredients: dados.ingredients,
				steps: dados.steps,
				usedProductSlugs: dados.usedProductSlugs,
			},
			// A gravação falhou com a foto já no bucket: ela não tem dono, sai.
			{ onError: () => descartarFoto(foto.enviada) },
		);
	};

	return (
		<>
			<PageHeading
				title="Nova receita"
				description="Ao salvar, ela já aparece no site e continua aberta aqui para ajustes."
			/>
			<RecipeForm
				inicial={RECEITA_VAZIA}
				editando={false}
				catalogo={produtos.data}
				enviando={enviandoFoto || criar.isPending}
				erro={erro}
				aoSalvar={salvar}
			/>
		</>
	);
}
