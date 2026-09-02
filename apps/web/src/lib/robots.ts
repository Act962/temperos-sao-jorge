import { SITE } from "@/data/site";

/**
 * Conteúdo do robots.txt, decidido pelo host que está servindo.
 *
 * Só o domínio de produção é liberado. Qualquer outro endereço — o
 * `*.vercel.app` de uma pré-visualização, um deploy de homologação, um domínio
 * antigo ainda apontado — responde `Disallow: /`.
 *
 * A alternativa seria uma variável dizendo "aqui é produção", e ela teria que
 * ser lembrada em cada ambiente novo. Esquecer é silencioso e caro: o buscador
 * indexa a URL provisória, e tirar de lá depois dá muito mais trabalho do que
 * nunca ter deixado entrar.
 */
export function ehHostDeProducao(host: string | null): boolean {
	if (!host) return false;
	// A porta não entra na comparação: em produção não há porta explícita.
	const servido = host.split(":")[0]?.trim().toLowerCase();
	return servido === new URL(SITE.url).hostname.toLowerCase();
}

export function renderRobots(host: string | null): string {
	if (!ehHostDeProducao(host)) {
		return ["User-agent: *", "Disallow: /", ""].join("\n");
	}

	return [
		"User-agent: *",
		"Allow: /",
		"",
		// O painel também sai por aqui, além do `noindex` das próprias rotas.
		"Disallow: /admin",
		"",
		`Sitemap: ${SITE.url}/sitemap.xml`,
		"",
	].join("\n");
}
