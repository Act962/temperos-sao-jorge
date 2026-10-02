import { createFileRoute } from "@tanstack/react-router";
import { LegalEditor } from "@/components/admin/legal-editor";

export const Route = createFileRoute("/admin/privacidade")({
	component: () => (
		<LegalEditor
			documento="privacy"
			titulo="Política de privacidade"
			caminho="/privacidade"
		/>
	),
});
