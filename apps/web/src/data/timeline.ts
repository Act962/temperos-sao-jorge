/** Company milestones shown on the "Sobre nós" page. */

export interface TimelineEntry {
	readonly year: string;
	readonly title: string;
	readonly text: string;
}

export const TIMELINE: readonly TimelineEntry[] = [
	{
		year: "1980",
		title: "Primeiros passos",
		text: "A família inicia a produção artesanal de massas em uma pequena fábrica.",
	},
	{
		year: "1990",
		title: "Primeira frota",
		text: "A distribuição própria leva os produtos para toda a região.",
	},
	{
		year: "2000",
		title: "Nova fábrica",
		text: "Ampliação da produção e chegada da linha de molhos.",
	},
	{
		year: "2010",
		title: "Linha completa",
		text: "Massas, molhos e temperos formam a família de produtos.",
	},
	{
		year: "Atualmente",
		title: "Presença nacional",
		text: "Milhares de famílias brasileiras à mesa todos os dias.",
	},
];
