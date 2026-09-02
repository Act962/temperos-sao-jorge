import { createFileRoute, Outlet, useRouter } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/admin-shell";
import { LoginForm } from "@/components/admin/login-form";
import { RouteLoader } from "@/components/ui/route-loader";
import { authClient, useSession } from "@/lib/auth-client";

/**
 * Camada do admin.
 *
 * Sem sessão, o formulário de acesso ocupa o lugar do conteúdo em vez de
 * redirecionar: a URL pretendida é preservada, então entrar em
 * `/admin/produtos` leva a `/admin/produtos` depois do login.
 */
export const Route = createFileRoute("/admin")({
	head: () => ({
		meta: [
			{ title: "Administração | São Jorge Alimentos" },
			// Painel interno: nunca deve aparecer em busca.
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
	component: AdminLayout,
});

function AdminLayout() {
	const { data: session, isPending } = useSession();
	const router = useRouter();

	if (isPending) return <RouteLoader />;
	if (!session) return <LoginForm />;

	return (
		<AdminShell
			usuario={session.user.email}
			aoSair={async () => {
				await authClient.signOut();
				await router.invalidate();
			}}
		>
			<Outlet />
		</AdminShell>
	);
}
