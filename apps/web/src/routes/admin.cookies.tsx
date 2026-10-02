import { createFileRoute } from "@tanstack/react-router";
import { LegalEditor } from "@/components/admin/legal-editor";

export const Route = createFileRoute("/admin/cookies")({
	component: () => (
		<LegalEditor
			documento="cookies"
			titulo="Política de cookies"
			caminho="/cookies"
		/>
	),
});
