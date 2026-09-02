// Gerado por packages/db/scripts/publish-catalog.mjs — não edite à mão.
// A fonte da verdade é o Postgres; rode `pnpm run catalog:publish` para
// regravar este arquivo a partir do banco.

export const RECIPE_CATEGORIES = [
	"Almoço",
	"Jantar",
	"Lanches",
	"Festas",
] as const;

export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number];

export const RECIPE_FILTERS = [
	"Todas",
	"Almoço",
	"Jantar",
	"Lanches",
	"Festas",
	"Até 30 min",
	"+ 30 min",
] as const;

export type RecipeFilter = (typeof RECIPE_FILTERS)[number];

export interface Recipe {
	readonly slug: string;
	readonly name: string;
	readonly time: string;
	readonly minutes: number;
	readonly level: "Fácil" | "Média" | "Difícil";
	readonly servings: number;
	readonly category: RecipeCategory;
	readonly summary: string;
	readonly image: string;
	readonly ingredients: readonly string[];
	readonly steps: readonly string[];
	readonly usedProductSlugs: readonly string[];
}

export const RECIPES: readonly Recipe[] = [
	{
		slug: "arroz-a-grega",
		name: "Arroz à Grega",
		time: "40 min",
		minutes: 40,
		level: "Fácil",
		servings: 6,
		category: "Almoço",
		summary:
			"Colorido, leve e perfeito para acompanhar assados: arroz soltinho com legumes em cubos e uvas-passas.",
		image: "/images/recipes/arroz-a-grega.jpg",
		ingredients: [
			"2 xícaras de arroz",
			"1 cenoura em cubos pequenos",
			"1/2 pimentão vermelho em cubos",
			"1/2 xícara de ervilhas",
			"1/2 xícara de uvas-passas",
			"1 colher de sopa de Alho em Pó São Jorge",
			"4 xícaras de água quente",
			"Sal a gosto",
		],
		steps: [
			"Refogue o arroz no azeite com o alho em pó por 2 minutos.",
			"Acrescente a cenoura e o pimentão e refogue por mais 2 minutos.",
			"Adicione a água quente e o sal, tampe e cozinhe em fogo baixo por cerca de 15 minutos.",
			"Quando a água secar, misture as ervilhas e as uvas-passas com um garfo.",
			"Tampe, desligue o fogo e deixe descansar 5 minutos antes de servir.",
		],
		usedProductSlugs: ["alho-em-po", "coloral"],
	},
	{
		slug: "frango-ao-molho-com-legumes",
		name: "Frango ao Molho com Legumes",
		time: "45 min",
		minutes: 45,
		level: "Fácil",
		servings: 4,
		category: "Jantar",
		summary:
			"Sobrecoxas douradas e cozidas no próprio molho com legumes da estação. Prato único, prático e completo.",
		image: "/images/recipes/frango-ao-molho-com-legumes.jpg",
		ingredients: [
			"6 sobrecoxas de frango",
			"2 colheres de sopa de Tempero para Frango São Jorge",
			"1 cebola em meia-lua",
			"2 cenouras em rodelas",
			"1 abobrinha em meia-lua",
			"400 g de molho de tomate",
			"1 xícara de água",
			"Azeite, sal e pimenta a gosto",
		],
		steps: [
			"Tempere o frango com o tempero para frango, sal e pimenta e deixe descansar 15 minutos.",
			"Doure as sobrecoxas dos dois lados em uma panela larga com azeite e reserve.",
			"Na mesma panela, refogue a cebola e a cenoura por 3 minutos.",
			"Volte o frango à panela, acrescente o molho de tomate e a água, tampe e cozinhe por 20 minutos.",
			"Junte a abobrinha e cozinhe por mais 5 minutos, até os legumes ficarem macios.",
			"Acerte o sal e sirva com arroz branco.",
		],
		usedProductSlugs: ["tempero-para-frango", "paprica-doce"],
	},
	{
		slug: "lasanha-a-bolonhesa",
		name: "Lasanha à Bolonhesa",
		time: "1 h 20 min",
		minutes: 80,
		level: "Média",
		servings: 6,
		category: "Jantar",
		summary:
			"Camadas de massa, ragu de carne bem temperado e queijo gratinado — o prato que reúne a família à mesa.",
		image: "/images/recipes/lasanha-a-bolonhesa.jpg",
		ingredients: [
			"500 g de massa para lasanha",
			"700 g de carne moída",
			"1 cebola picada",
			"2 colheres de sopa de Alho Triturado São Jorge",
			"800 g de molho de tomate",
			"400 g de queijo mussarela fatiado",
			"200 g de presunto fatiado",
			"Orégano, sal e pimenta-do-reino a gosto",
		],
		steps: [
			"Refogue a cebola e o alho triturado no azeite até dourarem.",
			"Acrescente a carne moída e cozinhe até perder a cor rosada, mexendo para soltar os grumos.",
			"Junte o molho de tomate, tempere com sal, pimenta-do-reino e orégano e cozinhe em fogo baixo por 20 minutos.",
			"Monte a lasanha alternando molho, massa, presunto e mussarela, terminando com molho e queijo.",
			"Cubra com papel-alumínio e asse a 180 °C por 30 minutos. Retire o papel e gratine por mais 10 minutos.",
			"Deixe descansar 10 minutos antes de servir.",
		],
		usedProductSlugs: [
			"alho-triturado-200-g",
			"oregano",
			"pimenta-do-reino-em-po",
		],
	},
	{
		slug: "macarrao-a-primavera",
		name: "Macarrão à Primavera",
		time: "30 min",
		minutes: 30,
		level: "Fácil",
		servings: 4,
		category: "Almoço",
		summary:
			"Massa leve com legumes salteados no azeite e ervas — pronta no tempo de cozinhar o macarrão.",
		image: "/images/recipes/macarrao-a-primavera.jpg",
		ingredients: [
			"500 g de macarrão penne",
			"1 abobrinha em tiras",
			"1 cenoura em tiras",
			"1 pimentão amarelo em tiras",
			"1 xícara de brócolis em floretes",
			"1 colher de chá de Alecrim São Jorge",
			"3 colheres de sopa de azeite",
			"Sal e pimenta a gosto",
		],
		steps: [
			"Cozinhe o macarrão em água e sal até ficar al dente. Reserve 1 xícara da água do cozimento.",
			"Enquanto isso, salteie os legumes no azeite em fogo alto por 5 minutos, mantendo-os crocantes.",
			"Tempere com alecrim, sal e pimenta.",
			"Misture o macarrão aos legumes e acrescente um pouco da água do cozimento para dar liga.",
			"Finalize com um fio de azeite e sirva imediatamente.",
		],
		usedProductSlugs: ["alecrim", "oregano"],
	},
	{
		slug: "macarrao-ao-molho-de-tomate-caseiro",
		name: "Macarrão ao Molho de Tomate Caseiro",
		time: "30 min",
		minutes: 30,
		level: "Fácil",
		servings: 4,
		category: "Almoço",
		summary:
			"Um clássico de todo dia: massa al dente, molho de tomate apurado com alho e cebola e manjericão fresco para finalizar.",
		image: "/images/recipes/macarrao-ao-molho-de-tomate-caseiro.jpg",
		ingredients: [
			"500 g de Macarrão Espaguete São Jorge",
			"1 lata de Molho de Tomate Tradicional São Jorge",
			"2 dentes de alho picados",
			"1/2 cebola picada",
			"2 colheres de azeite",
			"Sal e pimenta a gosto",
			"Folhas de manjericão",
		],
		steps: [
			"Cozinhe o macarrão conforme as instruções da embalagem. Escorra e reserve.",
			"Em uma panela, aqueça o azeite e doure o alho e a cebola.",
			"Adicione o molho de tomate, tempere com sal e pimenta e deixe cozinhar por 10 minutos, mexendo de vez em quando.",
			"Misture o macarrão ao molho, finalize com manjericão e sirva.",
		],
		usedProductSlugs: ["alho-triturado-200-g", "oregano"],
	},
	{
		slug: "nhoque-ao-molho-de-queijo",
		name: "Nhoque ao Molho de Queijo",
		time: "40 min",
		minutes: 40,
		level: "Média",
		servings: 4,
		category: "Jantar",
		summary:
			"Nhoque de batata em molho cremoso de queijo, finalizado com noz-moscada e pimenta-do-reino moída na hora.",
		image: "/images/recipes/nhoque-ao-molho-de-queijo.jpg",
		ingredients: [
			"1 kg de nhoque de batata",
			"500 ml de creme de leite fresco",
			"200 g de queijo parmesão ralado",
			"1 colher de sopa de manteiga",
			"1 colher de chá de Alho em Pó São Jorge",
			"Noz-moscada, sal e Pimenta do Reino em Pó São Jorge a gosto",
		],
		steps: [
			"Derreta a manteiga em uma panela e acrescente o alho em pó.",
			"Adicione o creme de leite e aqueça sem deixar ferver.",
			"Junte o parmesão aos poucos, mexendo até obter um molho liso.",
			"Tempere com sal, noz-moscada e pimenta-do-reino.",
			"Cozinhe o nhoque em água fervente com sal até subir à superfície e escorra.",
			"Misture o nhoque ao molho e sirva em seguida.",
		],
		usedProductSlugs: ["alho-em-po", "pimenta-do-reino-em-po"],
	},
];

export function getRecipeBySlug(slug: string): Recipe | undefined {
	return RECIPES.find((recipe) => recipe.slug === slug);
}

export function filterRecipes(
	recipes: readonly Recipe[],
	filter: RecipeFilter,
): readonly Recipe[] {
	if (filter === "Todas") return recipes;
	if (filter === "Até 30 min")
		return recipes.filter((recipe) => recipe.minutes <= 30);
	if (filter === "+ 30 min")
		return recipes.filter((recipe) => recipe.minutes > 30);
	return recipes.filter((recipe) => recipe.category === filter);
}
