/**
 * Busca das listagens do painel.
 *
 * Quem procura "cha" espera achar "Chá Verde", e quem digita "PAPRICA" espera
 * achar "Páprica Doce": a comparação ignora acento e caixa dos dois lados.
 */
export function semAcento(texto: string): string {
	return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/** Mantém os itens cujo texto contém o termo. Termo vazio não filtra nada. */
export function filtrarPorTermo<T>(
	itens: readonly T[],
	termo: string,
	texto: (item: T) => string,
): T[] {
	const alvo = semAcento(termo);
	if (alvo === "") return [...itens];
	return itens.filter((item) => semAcento(texto(item)).includes(alvo));
}
