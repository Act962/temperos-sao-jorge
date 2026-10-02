import { InvalidInputError } from "./errors";

/**
 * Conteúdo editável do site: um documento por tela do painel.
 *
 * Cada documento é guardado e lido inteiro. Mesclar campo a campo com um
 * padrão — só o que mudou fica salvo — parece econômico, mas torna impossível
 * um campo de fato vazio e faz item reordenado herdar texto de outro. Aqui o
 * que está salvo é o que vale, e o padrão só entra quando nada foi salvo.
 *
 * Os normalizadores aparam espaços, descartam linhas em branco e recusam o
 * que quebraria o site. Também são eles que conferem um documento lido do
 * banco: se o formato mudou e o que está salvo não passa mais, vale o padrão.
 */

export const CHAVES_DE_CONTEUDO = [
	"settings",
	"home",
	"about",
	"privacy",
	"cookies",
] as const;

export type ChaveDeConteudo = (typeof CHAVES_DE_CONTEUDO)[number];

export const REDES_SOCIAIS = ["instagram", "facebook", "youtube"] as const;
export type RedeSocial = (typeof REDES_SOCIAIS)[number];

export interface SiteSettings {
	/** Apresentação da empresa para os buscadores. */
	readonly description: string;
	readonly contact: {
		readonly phone: string;
		readonly email: string;
		readonly street: string;
		readonly district: string;
		readonly city: string;
		readonly state: string;
		readonly postalCode: string;
		readonly openingHours: string;
		/**
		 * Só com isto ligado o site publica o endereço como dado estruturado.
		 * Endereço de exemplo afirmado ao Google é um fato falso.
		 */
		readonly hasVerifiedAddress: boolean;
	};
	readonly whatsapp: {
		/** Como a pessoa digita: "(11) 99999-0000". Vazio esconde o botão. */
		readonly number: string;
		/** Texto que já vem preenchido na conversa. */
		readonly message: string;
	};
	readonly social: readonly {
		readonly platform: RedeSocial;
		readonly href: string;
	}[];
	/** Opções do campo "Assunto" do formulário de contato. */
	readonly contactSubjects: readonly string[];
}

export interface HomeContent {
	readonly hero: {
		/** Uma quebra de linha no texto vira quebra de linha no título. */
		readonly title: string;
		readonly text: string;
		readonly imageAlt: string;
	};
	readonly story: {
		readonly title: string;
		readonly text: string;
		/** A frase manuscrita ao lado da foto. */
		readonly note: string;
		readonly imageAlt: string;
	};
	readonly families: {
		readonly title: string;
		/** Slug da família → slug do produto cuja foto a representa. */
		readonly representatives: Readonly<Record<string, string>>;
	};
	readonly recipes: {
		readonly title: string;
		readonly text: string;
	};
	/** Sempre quatro: o site tem um ícone fixo para cada posição. */
	readonly values: readonly { readonly title: string; readonly text: string }[];
}

export interface TimelineEntry {
	readonly year: string;
	readonly title: string;
	readonly text: string;
}

export interface AboutContent {
	readonly intro: string;
	readonly story: readonly string[];
	readonly timelineTitle: string;
	readonly timeline: readonly TimelineEntry[];
}

export interface LegalCard {
	readonly title: string;
	readonly text: string;
}

export interface LegalSection {
	/** Vazio no parágrafo de abertura, que não tem título. */
	readonly heading: string;
	readonly paragraphs: readonly string[];
	readonly cards: readonly LegalCard[];
}

export interface LegalDocument {
	readonly title: string;
	readonly updatedAt: string;
	readonly summary: string;
	readonly sections: readonly LegalSection[];
}

export interface SiteContent {
	readonly settings: SiteSettings;
	readonly home: HomeContent;
	readonly about: AboutContent;
	readonly privacy: LegalDocument;
	readonly cookies: LegalDocument;
}

export const TOTAL_DE_COMPROMISSOS = 4;

function texto(valor: string): string {
	return valor.trim();
}

function exigir(valor: string, mensagem: string): string {
	const limpo = texto(valor);
	if (limpo === "") throw new InvalidInputError(mensagem);
	return limpo;
}

/** Apara cada linha e descarta as vazias — rastro de quem clicou em adicionar. */
function linhas(valores: readonly string[]): string[] {
	return valores.map(texto).filter((valor) => valor !== "");
}

/** Só os dígitos de um telefone digitado com parênteses, espaço e hífen. */
export function digitosDoTelefone(telefone: string): string {
	return telefone.replace(/\D/g, "");
}

/**
 * Número no formato do wa.me e do `tel:`: código do país, DDD e número.
 *
 * Quem digita um telefone brasileiro não escreve o 55; com DDD são 10 ou 11
 * dígitos, e é esse o caso que recebe o prefixo.
 */
export function telefoneInternacional(telefone: string): string {
	const digitos = digitosDoTelefone(telefone);
	if (digitos.length === 10 || digitos.length === 11) return `55${digitos}`;
	return digitos;
}

export function normalizarConfiguracoes(entrada: SiteSettings): SiteSettings {
	const email = exigir(entrada.contact.email, "Informe o e-mail de contato.");
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		throw new InvalidInputError(`E-mail de contato inválido: "${email}".`);
	}

	const phone = exigir(entrada.contact.phone, "Informe o telefone de contato.");
	if (digitosDoTelefone(phone).length < 10) {
		throw new InvalidInputError(
			`Telefone incompleto: "${phone}". Informe o DDD e o número.`,
		);
	}

	const whatsapp = texto(entrada.whatsapp.number);
	if (whatsapp !== "") {
		const total = telefoneInternacional(whatsapp).length;
		if (total < 12 || total > 13) {
			throw new InvalidInputError(
				`WhatsApp incompleto: "${whatsapp}". Informe o DDD e o número, ou deixe em branco para esconder o botão.`,
			);
		}
	}

	const state = texto(entrada.contact.state).toUpperCase();
	if (!/^[A-Z]{2}$/.test(state)) {
		throw new InvalidInputError("A UF tem duas letras, como SP.");
	}

	const vistas = new Set<string>();
	const social = entrada.social.map((rede) => {
		if (!REDES_SOCIAIS.includes(rede.platform)) {
			throw new InvalidInputError(
				`Rede social desconhecida: "${rede.platform}".`,
			);
		}
		if (vistas.has(rede.platform)) {
			throw new InvalidInputError(
				`A rede ${rede.platform} aparece mais de uma vez.`,
			);
		}
		vistas.add(rede.platform);

		const href = texto(rede.href);
		// Só `https://` e com caminho: link para a raiz da plataforma não leva a
		// perfil nenhum e enfraquece o `sameAs` que o Google lê.
		if (!/^https:\/\/[^\s/]+\/\S+/.test(href)) {
			throw new InvalidInputError(
				`O link do ${rede.platform} precisa ser o endereço completo do perfil, começando por https://.`,
			);
		}
		return { platform: rede.platform, href };
	});

	const contactSubjects = [...new Set(linhas(entrada.contactSubjects))];
	if (contactSubjects.length === 0) {
		throw new InvalidInputError(
			"O formulário de contato precisa de pelo menos um assunto.",
		);
	}

	return {
		description: exigir(entrada.description, "Informe a descrição da empresa."),
		contact: {
			phone,
			email,
			street: texto(entrada.contact.street),
			district: texto(entrada.contact.district),
			city: texto(entrada.contact.city),
			state,
			postalCode: texto(entrada.contact.postalCode),
			openingHours: texto(entrada.contact.openingHours),
			hasVerifiedAddress: entrada.contact.hasVerifiedAddress === true,
		},
		whatsapp: { number: whatsapp, message: texto(entrada.whatsapp.message) },
		social,
		contactSubjects,
	};
}

export function normalizarInicio(entrada: HomeContent): HomeContent {
	if (entrada.values.length !== TOTAL_DE_COMPROMISSOS) {
		throw new InvalidInputError(
			`A home mostra exatamente ${TOTAL_DE_COMPROMISSOS} compromissos.`,
		);
	}

	const representatives: Record<string, string> = {};
	for (const [familia, produto] of Object.entries(
		entrada.families.representatives,
	)) {
		// Sem escolha, a home usa o primeiro produto da família.
		if (texto(produto) !== "") representatives[familia] = texto(produto);
	}

	return {
		hero: {
			title: exigir(entrada.hero.title, "A abertura precisa de um título."),
			text: exigir(entrada.hero.text, "A abertura precisa de um texto."),
			imageAlt: texto(entrada.hero.imageAlt),
		},
		story: {
			title: exigir(entrada.story.title, "“Nossa história” precisa de título."),
			text: exigir(entrada.story.text, "“Nossa história” precisa de texto."),
			note: texto(entrada.story.note),
			imageAlt: texto(entrada.story.imageAlt),
		},
		families: {
			title: exigir(
				entrada.families.title,
				"A seção de famílias precisa de título.",
			),
			representatives,
		},
		recipes: {
			title: exigir(
				entrada.recipes.title,
				"A chamada de receitas precisa de título.",
			),
			text: texto(entrada.recipes.text),
		},
		values: entrada.values.map((valor, indice) => ({
			title: exigir(
				valor.title,
				`O compromisso ${indice + 1} precisa de título.`,
			),
			text: exigir(valor.text, `O compromisso ${indice + 1} precisa de texto.`),
		})),
	};
}

export function normalizarSobre(entrada: AboutContent): AboutContent {
	const story = linhas(entrada.story);
	if (story.length === 0) {
		throw new InvalidInputError(
			"A história precisa de pelo menos um parágrafo.",
		);
	}

	if (entrada.timeline.length === 0) {
		throw new InvalidInputError(
			"A linha do tempo precisa de pelo menos um marco.",
		);
	}

	return {
		intro: texto(entrada.intro),
		story,
		timelineTitle: exigir(
			entrada.timelineTitle,
			"A linha do tempo precisa de título.",
		),
		timeline: entrada.timeline.map((marco, indice) => ({
			year: exigir(marco.year, `O marco ${indice + 1} precisa do ano.`),
			title: exigir(marco.title, `O marco ${indice + 1} precisa de título.`),
			text: exigir(marco.text, `O marco ${indice + 1} precisa de texto.`),
		})),
	};
}

export function normalizarDocumentoLegal(
	entrada: LegalDocument,
): LegalDocument {
	const sections = entrada.sections.map((secao, indice) => {
		const paragraphs = linhas(secao.paragraphs);
		const cards = secao.cards
			.map((cartao) => ({
				title: texto(cartao.title),
				text: texto(cartao.text),
			}))
			.filter((cartao) => cartao.title !== "" || cartao.text !== "");

		for (const cartao of cards) {
			if (cartao.title === "" || cartao.text === "") {
				throw new InvalidInputError(
					`Na seção ${indice + 1}, todo quadro precisa de título e texto.`,
				);
			}
		}

		if (paragraphs.length === 0 && cards.length === 0) {
			throw new InvalidInputError(
				`A seção ${indice + 1} está vazia. Escreva um parágrafo ou remova a seção.`,
			);
		}

		return { heading: texto(secao.heading), paragraphs, cards };
	});

	if (sections.length === 0) {
		throw new InvalidInputError("O documento precisa de pelo menos uma seção.");
	}

	return {
		title: exigir(entrada.title, "O documento precisa de título."),
		updatedAt: exigir(
			entrada.updatedAt,
			"Informe a data da última atualização.",
		),
		summary: exigir(entrada.summary, "O documento precisa de um resumo."),
		sections,
	};
}

/** O normalizador de cada documento, pela chave. */
export const NORMALIZADORES: {
	readonly [C in ChaveDeConteudo]: (entrada: SiteContent[C]) => SiteContent[C];
} = {
	settings: normalizarConfiguracoes,
	home: normalizarInicio,
	about: normalizarSobre,
	privacy: normalizarDocumentoLegal,
	cookies: normalizarDocumentoLegal,
};

/**
 * Troca `{produtos}` e `{familias}` pela contagem do catálogo.
 *
 * Sem isso, "105 produtos em 8 famílias" envelheceria na primeira vez que
 * alguém cadastrasse um produto.
 */
export function preencherContagens(
	textoComMarcas: string,
	contagens: { produtos: number; familias: number },
): string {
	return textoComMarcas
		.replaceAll("{produtos}", String(contagens.produtos))
		.replaceAll("{familias}", String(contagens.familias));
}
