import { createFileRoute, Outlet, useRouter } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminUnavailable } from "@/components/admin/admin-unavailable";
import { LoginForm } from "@/components/admin/login-form";
import { RouteLoader } from "@/components/ui/route-loader";
import { authClient, useSession } from "@/lib/auth-client";

/**
 * Camada do admin.
 *
 * Sem sessão, o formulário de acesso ocupa o lugar do conteúdo em vez de
 * redirecionar: a URL pretendida é preservada, então entrar em
 * `/admin/produtos` leva a `/admin/produtos` depois do login.
 *
 * Sem API respondendo — ambiente publicado sem banco — nem o formulário
 * aparece: não há login possível, e mostrar o campo seria prometer o que a
 * tela não entrega.
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
	const { data: session, isPending, error } = useSession();
	const router = useRouter();

	if (isPending) return <RouteLoader />;
	// Sessão que nem pôde ser consultada não é "não autenticado": oferecer o
	// formulário aqui só levaria a pessoa a digitar a senha para receber um erro
	// cru do servidor.
	if (error) return <AdminUnavailable />;
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
