import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@my-better-t-app/ui/components/alert-dialog";

interface ConfirmDialogProps {
	aberto: boolean;
	titulo: string;
	descricao: string;
	rotuloConfirmar?: string;
	aoConfirmar: () => void;
	aoCancelar: () => void;
}

/**
 * Confirmação antes de uma ação que não se desfaz.
 *
 * Substitui o `confirm()` do navegador, que no celular abre com o endereço do
 * site no título e não diz o que vai acontecer com o item.
 */
export function ConfirmDialog({
	aberto,
	titulo,
	descricao,
	rotuloConfirmar = "Remover",
	aoConfirmar,
	aoCancelar,
}: ConfirmDialogProps) {
	return (
		<AlertDialog
			open={aberto}
			onOpenChange={(estado) => !estado && aoCancelar()}
		>
			<AlertDialogContent className="p-5">
				<AlertDialogHeader>
					<AlertDialogTitle className="font-sans font-semibold text-base text-ink">
						{titulo}
					</AlertDialogTitle>
					<AlertDialogDescription className="font-sans text-ink-muted text-sm">
						{descricao}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancelar</AlertDialogCancel>
					<AlertDialogAction onClick={aoConfirmar}>
						{rotuloConfirmar}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
