import { urlDaImagem } from "@my-better-t-app/core";
import { Button } from "@my-better-t-app/ui/components/button";
import { Label } from "@my-better-t-app/ui/components/label";
import { cn } from "@my-better-t-app/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ImageOff, ImagePlus, Upload } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { conferirArquivo, type ValorDaFoto } from "@/components/admin/photo";
import { useTRPC } from "@/utils/trpc";

interface PhotoFieldProps {
	rotulo: string;
	valor: ValorDaFoto;
	aoMudar: (valor: ValorDaFoto) => void;
	/**
	 * `packshot` é o quadrado pequeno do produto, com a foto inteira dentro;
	 * `foto` é a faixa larga da receita, cortada como na página dela.
	 */
	formato: "packshot" | "foto";
	/** O formulário está salvando: a foto nova está a caminho do bucket. */
	enviando: boolean;
	ajuda?: string;
}

/** Endereço temporário do arquivo escolhido, liberado quando ele muda. */
function usePrevia(arquivo: File | null): string | null {
	const [previa, setPrevia] = useState<string | null>(null);

	useEffect(() => {
		if (arquivo === null) {
			setPrevia(null);
			return;
		}
		const endereco = URL.createObjectURL(arquivo);
		setPrevia(endereco);
		return () => URL.revokeObjectURL(endereco);
	}, [arquivo]);

	return previa;
}

/**
 * Campo de foto do painel (spec 0010).
 *
 * Só escolhe: o arquivo fica no formulário e sobe quando ele é salvo, por
 * `resolverFoto`. Assim, cancelar a edição não deixa arquivo no bucket.
 *
 * Sem bucket configurado o campo aparece desligado, com a explicação, e o
 * resto do formulário continua valendo.
 */
export function PhotoField({
	rotulo,
	valor,
	aoMudar,
	formato,
	enviando,
	ajuda,
}: PhotoFieldProps) {
	const trpc = useTRPC();
	const estado = useQuery({
		...trpc.imagens.estado.queryOptions(),
		// Configuração de ambiente: não muda enquanto a aba está aberta.
		staleTime: Number.POSITIVE_INFINITY,
	});

	const ids = { campo: useId(), ajuda: useId() };
	const seletor = useRef<HTMLInputElement>(null);
	const [recusa, setRecusa] = useState<string | null>(null);
	const previa = usePrevia(valor.nova);

	const ligado = estado.data?.ligado ?? false;
	const salva = urlDaImagem(valor.atual, estado.data?.base);
	const mostrada = previa ?? (salva === "" ? null : salva);
	const temFoto = valor.nova !== null || valor.atual !== "";

	const escolher = (arquivo: File | undefined) => {
		if (!arquivo || !estado.data) return;

		const motivo = conferirArquivo(arquivo, estado.data);
		setRecusa(motivo);
		if (motivo === null) aoMudar({ ...valor, nova: arquivo });
	};

	const titulo = valor.nova
		? valor.nova.name
		: valor.atual !== ""
			? "Foto atual"
			: "Nenhuma foto ainda";

	const situacao = (() => {
		if (enviando && valor.nova) return "Enviando a foto…";
		if (valor.nova) return "Vai ao ar quando você salvar.";
		if (estado.isPending) return "Carregando…";
		if (!ligado) {
			return "O envio de fotos ainda não foi configurado neste ambiente. O resto pode ser salvo normalmente.";
		}
		if (valor.atual !== "") return "É a que aparece no site.";
		return "O site mostra um espaço reservado.";
	})();

	const larga = formato === "foto";

	return (
		<div className="flex flex-col gap-1.5">
			<Label htmlFor={ids.campo}>{rotulo}</Label>

			<div className={cn("flex gap-3", larga ? "flex-col" : "items-center")}>
				<div
					className={cn(
						"flex shrink-0 items-center justify-center overflow-hidden rounded-md border bg-cream-sunken",
						larga ? "h-36 w-full sm:h-44" : "size-20",
						mostrada
							? valor.nova
								? "border-brand/50"
								: "border-brand/15"
							: "border-brand/30 border-dashed text-ink-faint",
					)}
				>
					{mostrada ? (
						<img
							src={mostrada}
							alt=""
							className={cn(
								"size-full",
								larga ? "object-cover" : "object-contain p-1",
							)}
						/>
					) : ligado || estado.isPending ? (
						<ImagePlus aria-hidden="true" className="size-6" />
					) : (
						<ImageOff aria-hidden="true" className="size-6" />
					)}
				</div>

				<div className="min-w-0">
					<p className="flex flex-wrap items-center gap-x-2 font-medium font-sans text-ink text-sm">
						<span className="truncate">{titulo}</span>
						{valor.nova ? (
							<span className="rounded-full bg-brand/10 px-2 py-0.5 font-semibold text-[0.6875rem] text-brand">
								nova
							</span>
						) : null}
					</p>
					<p
						aria-live="polite"
						className="mt-0.5 font-sans text-ink-muted text-xs"
					>
						{situacao}
					</p>

					<div className="mt-2 flex flex-wrap gap-2">
						{ligado ? (
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={enviando}
								onClick={() => seletor.current?.click()}
							>
								<Upload aria-hidden="true" />
								{valor.nova
									? "Escolher outra"
									: valor.atual !== ""
										? "Trocar foto"
										: "Escolher foto"}
							</Button>
						) : null}

						{valor.nova ? (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								disabled={enviando}
								onClick={() => {
									setRecusa(null);
									aoMudar({ ...valor, nova: null });
								}}
							>
								Desfazer
							</Button>
						) : temFoto ? (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								disabled={enviando}
								onClick={() => {
									setRecusa(null);
									aoMudar({ atual: "", nova: null });
								}}
							>
								Remover foto
							</Button>
						) : null}
					</div>
				</div>
			</div>

			{/* O seletor de verdade fica fora da vista: quem aparece é o botão.
			    Continua no documento, com o rótulo do campo, para o leitor de tela
			    e para o teclado. */}
			<input
				ref={seletor}
				id={ids.campo}
				type="file"
				className="sr-only"
				tabIndex={-1}
				disabled={!ligado || enviando}
				accept={estado.data?.tipos.join(",")}
				aria-describedby={ids.ajuda}
				onChange={(evento) => {
					escolher(evento.target.files?.[0]);
					// Sem limpar, escolher o mesmo arquivo de novo não dispara nada.
					evento.target.value = "";
				}}
			/>

			{recusa ? (
				<p role="alert" className="font-sans text-brand text-sm">
					{recusa}
				</p>
			) : null}

			<p id={ids.ajuda} className="font-sans text-ink-faint text-xs">
				{ajuda ?? "PNG, JPG ou WebP, até 20 MB."}
			</p>
		</div>
	);
}
