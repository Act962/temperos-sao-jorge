import {
	BookOpenText,
	Boxes,
	Cookie,
	CookingPot,
	House,
	Layers,
	LayoutDashboard,
	Settings,
	ShieldCheck,
	Users,
} from "lucide-react";

/**
 * Navegação do painel.
 *
 * Fonte única: a barra lateral, a gaveta do celular e a trilha da barra
 * superior saem daqui. Os grupos seguem o que a pessoa procura ("onde mexo
 * nos produtos?"), não as tabelas do banco.
 */
export const NAV = [
	{
		grupo: null,
		itens: [
			{
				to: "/admin",
				label: "Visão geral",
				icon: LayoutDashboard,
				exact: true,
			},
		],
	},
	{
		grupo: "Catálogo",
		itens: [
			{ to: "/admin/produtos", label: "Produtos", icon: Boxes, exact: false },
			{ to: "/admin/familias", label: "Famílias", icon: Layers, exact: false },
			{
				to: "/admin/receitas",
				label: "Receitas",
				icon: CookingPot,
				exact: false,
			},
		],
	},
	{
		grupo: "Páginas do site",
		itens: [
			{ to: "/admin/inicio", label: "Início", icon: House, exact: false },
			{
				to: "/admin/sobre",
				label: "Sobre nós",
				icon: BookOpenText,
				exact: false,
			},
			{
				to: "/admin/privacidade",
				label: "Privacidade",
				icon: ShieldCheck,
				exact: false,
			},
			{ to: "/admin/cookies", label: "Cookies", icon: Cookie, exact: false },
		],
	},
	{
		grupo: "Geral",
		itens: [
			{
				to: "/admin/configuracoes",
				label: "Configurações",
				icon: Settings,
				exact: false,
			},
			{ to: "/admin/usuarios", label: "Usuários", icon: Users, exact: false },
		],
	},
] as const;

export type ItemDeNav = (typeof NAV)[number]["itens"][number];

/** A seção do painel a que um caminho pertence, para a trilha. */
export function secaoAtual(pathname: string): ItemDeNav | undefined {
	const itens = NAV.flatMap((grupo) => [...grupo.itens]);
	return itens.find((item) =>
		item.exact
			? pathname === item.to || pathname === `${item.to}/`
			: pathname === item.to || pathname.startsWith(`${item.to}/`),
	);
}
