import { Button, buttonVariants } from "@my-better-t-app/ui/components/button";
import { Input } from "@my-better-t-app/ui/components/input";
import { Label } from "@my-better-t-app/ui/components/label";
import { Textarea } from "@my-better-t-app/ui/components/textarea";
import { Link } from "@tanstack/react-router";
import { useId, useState } from "react";
import { OrderedListField } from "@/components/admin/ordered-list-field";
import { ProductPicker } from "@/components/admin/product-picker";

export const NIVEIS = ["Fácil", "Média", "Difícil"] as const;
export const CATEGORIAS = ["Almoço", "Jantar", "Lanches", "Festas"] as const;

export interface ReceitaFormulario {
	slug: string;
	name: string;
	summary: string;
	minutes: number;
	level: (typeof NIVEIS)[number];
	servings: number;
	category: (typeof CATEGORIAS)[number];
	image: string;
	ingredients: string[];
	steps: string[];
	usedProductSlugs: string[];
}

export const RECEITA_VAZIA: ReceitaFormulario = {
	slug: "",
	name: "",
	summary: "",
	minutes: 30,
	level: "Fácil",
	servings: 4,
	category: "Almoço",
	image: "",
	ingredients: [""],
	steps: [""],
	usedProductSlugs: [],
};

interface RecipeFormProps {
	inicial: ReceitaFormulario;
	/** Ausente ao criar; o slug é a URL e não muda depois. */
	editando: boolean;
	catalogo: readonly { slug: string; name: string }[];
	enviando: boolean;
	erro: string | null;
	aoSalvar: (dados: ReceitaFormulario) => void;
}

const CLASSE_SELECT =
	"h-9 rounded-md border border-input bg-transparent px-3 font-sans text-sm";

/**
 * Formulário de receita, em página própria.
 *
 * Não valida duração, porções nem listas vazias: quem decide é o domínio, e a
 * mensagem dele aparece no fim do formulário. Duplicar a regra aqui criaria uma
 * segunda verdade para manter em sincronia.
 *
 * Linhas em branco são descartadas no envio — são o rastro natural de quem
 * clicou em "adicionar" e mudou de ideia, não conteúdo.
 */
export function RecipeForm({
	inicial,
	editando,
	catalogo,
	enviando,
	erro,
	aoSalvar,
}: RecipeFormProps) {
	const ids = {
		slug: useId(),
		name: useId(),
		summary: useId(),
		minutes: useId(),
		servings: useId(),
		level: useId(),
		category: useId(),
		image: useId(),
	};
	const [dados, setDados] = useState(inicial);

	const mudar = <C extends keyof ReceitaFormulario>(
		campo: C,
		valor: ReceitaFormulario[C],
	) => setDados((atual) => ({ ...atual, [campo]: valor }));

	return (
		<form
			className="max-w-2xl"
			onSubmit={(evento) => {
				evento.preventDefault();
				const limpo = (lista: string[]) =>
					lista.map((item) => item.trim()).filter((item) => item !== "");

				aoSalvar({
					...dados,
					slug: dados.slug.trim(),
					name: dados.name.trim(),
					summary: dados.summary.trim(),
					image: dados.image.trim(),
					ingredients: limpo(dados.ingredients),
					steps: limpo(dados.steps),
				});
			}}
		>
			<div className="flex flex-col gap-6 rounded-lg border border-brand/12 bg-cream-raised p-6">
				<div className="grid gap-4 sm:grid-cols-2">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor={ids.slug}>Slug</Label>
						<Input
							id={ids.slug}
							value={dados.slug}
							readOnly={editando}
							required
							placeholder="arroz-a-grega"
							onChange={(evento) => mudar("slug", evento.target.value)}
						/>
						{editando ? (
							<p className="font-sans text-ink-faint text-xs">
								O slug é a URL da receita e não muda depois de criada.
							</p>
						) : null}
					</div>

					<div className="flex flex-col gap-1.5">
						<Label htmlFor={ids.name}>Nome</Label>
						<Input
							id={ids.name}
							value={dados.name}
							required
							placeholder="Arroz à Grega"
							onChange={(evento) => mudar("name", evento.target.value)}
						/>
					</div>
				</div>

				<div className="flex flex-col gap-1.5">
					<Label htmlFor={ids.summary}>Chamada</Label>
					<Textarea
						id={ids.summary}
						value={dados.summary}
						rows={2}
						placeholder="Uma frase que aparece no card da receita."
						onChange={(evento) => mudar("summary", evento.target.value)}
					/>
				</div>

				<div className="grid gap-4 sm:grid-cols-4">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor={ids.minutes}>Minutos</Label>
						<Input
							id={ids.minutes}
							type="number"
							min={1}
							step={1}
							value={dados.minutes}
							required
							onChange={(evento) =>
								mudar("minutes", evento.target.valueAsNumber)
							}
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<Label htmlFor={ids.servings}>Porções</Label>
						<Input
							id={ids.servings}
							type="number"
							min={1}
							step={1}
							value={dados.servings}
							required
							onChange={(evento) =>
								mudar("servings", evento.target.valueAsNumber)
							}
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<Label htmlFor={ids.level}>Nível</Label>
						<select
							id={ids.level}
							className={CLASSE_SELECT}
							value={dados.level}
							onChange={(evento) =>
								mudar(
									"level",
									evento.target.value as ReceitaFormulario["level"],
								)
							}
						>
							{NIVEIS.map((nivel) => (
								<option key={nivel} value={nivel}>
									{nivel}
								</option>
							))}
						</select>
					</div>

					<div className="flex flex-col gap-1.5">
						<Label htmlFor={ids.category}>Categoria</Label>
						<select
							id={ids.category}
							className={CLASSE_SELECT}
							value={dados.category}
							onChange={(evento) =>
								mudar(
									"category",
									evento.target.value as ReceitaFormulario["category"],
								)
							}
						>
							{CATEGORIAS.map((categoria) => (
								<option key={categoria} value={categoria}>
									{categoria}
								</option>
							))}
						</select>
					</div>
				</div>

				<p className="-mt-3 font-sans text-ink-faint text-xs">
					O tempo exibido ("1 h 20 min") e o do JSON-LD são derivados dos
					minutos na publicação.
				</p>

				<div className="flex flex-col gap-1.5">
					<Label htmlFor={ids.image}>Foto</Label>
					<Input
						id={ids.image}
						value={dados.image}
						placeholder="/images/recipes/arroz-a-grega.webp"
						onChange={(evento) => mudar("image", evento.target.value)}
					/>
					<p className="font-sans text-ink-faint text-xs">
						Deixe vazio enquanto a foto não existir.
					</p>
				</div>

				<OrderedListField
					rotulo="Ingredientes"
					ajuda="Um por linha, com a quantidade: 2 xícaras de arroz."
					itens={dados.ingredients}
					aoMudar={(itens) => mudar("ingredients", itens)}
					placeholder="2 xícaras de arroz"
					textoAdicionar="Adicionar ingrediente"
				/>

				<OrderedListField
					rotulo="Modo de preparo"
					ajuda="Um passo por linha, na ordem em que acontecem."
					itens={dados.steps}
					aoMudar={(itens) => mudar("steps", itens)}
					placeholder="Refogue a cebola até dourar."
					textoAdicionar="Adicionar passo"
				/>

				<ProductPicker
					catalogo={catalogo}
					selecionados={dados.usedProductSlugs}
					aoMudar={(slugs) => mudar("usedProductSlugs", slugs)}
				/>

				{erro ? (
					<p role="alert" className="font-sans text-brand text-sm">
						{erro}
					</p>
				) : null}
			</div>

			<div className="mt-5 flex gap-2">
				<Button type="submit" disabled={enviando}>
					{enviando ? "Salvando…" : "Salvar receita"}
				</Button>
				{/* O Button daqui é o do Base UI, que não tem `asChild`. Um Link com
				    as mesmas classes evita empilhar um botão dentro de uma âncora. */}
				<Link
					to="/admin/receitas"
					className={buttonVariants({ variant: "outline" })}
				>
					Cancelar
				</Link>
			</div>
		</form>
	);
}
