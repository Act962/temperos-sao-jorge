import type { LegalCard, LegalDocument, SiteContent } from "./site-content";

/**
 * O conteúdo do site antes de qualquer edição pelo painel.
 *
 * São os textos que o site já exibia quando eles moravam nos componentes e em
 * `apps/web/src/data/`. Enquanto um documento não é salvo, é isto que o site
 * mostra e é isto que a tela do painel abre para editar.
 *
 * Os dados de contato são os de exemplo que vieram do design — por isso
 * `hasVerifiedAddress` começa desligado, e o endereço não é publicado como
 * dado estruturado até alguém conferi-lo em Configurações.
 */

/** As políticas são escritas sem os campos vazios; `completar` os preenche. */
interface SecaoSolta {
	heading?: string;
	paragraphs?: readonly string[];
	cards?: readonly LegalCard[];
}

interface DocumentoSolto extends Omit<LegalDocument, "sections"> {
	sections: readonly SecaoSolta[];
}

function completar(documento: DocumentoSolto): LegalDocument {
	return {
		...documento,
		sections: documento.sections.map((secao) => ({
			heading: secao.heading ?? "",
			paragraphs: secao.paragraphs ?? [],
			cards: secao.cards ?? [],
		})),
	};
}

const POLITICA_DE_PRIVACIDADE: DocumentoSolto = {
	title: "Política de Privacidade",
	updatedAt: "janeiro de 2026",
	summary:
		"Como a São Jorge Alimentos coleta, utiliza, armazena e protege os dados pessoais tratados neste site, em conformidade com a LGPD.",
	sections: [
		{
			paragraphs: [
				"A São Jorge Alimentos valoriza a privacidade de seus visitantes, clientes e parceiros. Esta Política de Privacidade descreve como coletamos, utilizamos, armazenamos e protegemos os dados pessoais tratados por meio deste site, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).",
			],
		},
		{
			heading: "1. Dados que coletamos",
			paragraphs: [
				"Coletamos os dados que você nos fornece diretamente ao preencher formulários de contato, cadastro em nossa newsletter ou solicitações de atendimento — como nome, e-mail, telefone e mensagem. Também coletamos automaticamente informações de navegação, como endereço IP, tipo de dispositivo e páginas acessadas.",
			],
		},
		{
			heading: "2. Como utilizamos os dados",
			paragraphs: [
				"Utilizamos seus dados para responder solicitações, enviar novidades e receitas quando autorizado, melhorar a experiência de navegação e cumprir obrigações legais. Não vendemos nem compartilhamos seus dados pessoais com terceiros para fins de marketing sem o seu consentimento.",
			],
		},
		{
			heading: "3. Compartilhamento",
			paragraphs: [
				"Poderemos compartilhar dados com prestadores de serviço que nos apoiam na operação do site e do atendimento, sempre sob obrigações de confidencialidade, ou quando exigido por autoridade competente.",
			],
		},
		{
			heading: "4. Seus direitos",
			paragraphs: [
				"Você pode, a qualquer momento, solicitar acesso, correção, portabilidade ou exclusão dos seus dados, bem como revogar consentimentos concedidos. Para exercer esses direitos, entre em contato pelo e-mail sac@saojorgealimentos.com.br.",
			],
		},
		{
			heading: "5. Segurança e retenção",
			paragraphs: [
				"Adotamos medidas técnicas e organizacionais para proteger seus dados contra acessos não autorizados. Os dados são mantidos apenas pelo período necessário às finalidades descritas ou conforme exigência legal.",
			],
		},
		{
			heading: "6. Contato do encarregado",
			paragraphs: [
				"Em caso de dúvidas sobre esta política ou sobre o tratamento dos seus dados, fale com nosso encarregado de dados (DPO) pelo e-mail sac@saojorgealimentos.com.br.",
			],
		},
	],
};

const POLITICA_DE_COOKIES: DocumentoSolto = {
	title: "Política de Cookies",
	updatedAt: "janeiro de 2026",
	summary:
		"O que são cookies, quais tipos este site utiliza e como você pode gerenciá-los no seu navegador.",
	sections: [
		{
			paragraphs: [
				"Este site utiliza cookies para oferecer uma melhor experiência de navegação. Esta Política de Cookies explica o que são, como e por que os utilizamos, e como você pode gerenciá-los.",
			],
		},
		{
			heading: "1. O que são cookies",
			paragraphs: [
				"Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você visita um site. Eles permitem reconhecer o seu navegador e guardar determinadas informações para melhorar a sua experiência.",
			],
		},
		{
			heading: "2. Tipos de cookies que usamos",
			cards: [
				{
					title: "Essenciais",
					text: "Necessários para o funcionamento do site. Sem eles, algumas áreas não operam corretamente.",
				},
				{
					title: "Desempenho e análise",
					text: "Ajudam a entender como os visitantes usam o site, de forma agregada, para melhorarmos o conteúdo.",
				},
				{
					title: "Funcionais",
					text: "Memorizam preferências, como idioma e escolhas feitas, para personalizar a navegação.",
				},
			],
		},
		{
			heading: "3. Como gerenciar",
			paragraphs: [
				"Você pode configurar o seu navegador para bloquear ou avisar sobre o uso de cookies. A desativação de alguns cookies pode afetar o funcionamento de partes do site. As opções de gerenciamento estão disponíveis nas configurações do seu navegador.",
			],
		},
		{
			heading: "4. Dúvidas",
			paragraphs: [
				"Para mais informações sobre o uso de cookies e dados pessoais, consulte nossa Política de Privacidade ou fale conosco pelo e-mail sac@saojorgealimentos.com.br.",
			],
		},
	],
};

export const CONTEUDO_PADRAO: SiteContent = {
	settings: {
		description:
			"Há mais de 40 anos a São Jorge Alimentos leva temperos, chás, ervas, molhos e grãos de qualidade para a mesa das famílias brasileiras.",
		contact: {
			phone: "(11) 3000-0000",
			email: "sac@saojorgealimentos.com.br",
			street: "Rua das Indústrias, 123",
			district: "Bairro Industrial",
			city: "São Paulo",
			state: "SP",
			postalCode: "00000-000",
			openingHours: "Segunda a sexta, 8h às 17h",
			hasVerifiedAddress: false,
		},
		whatsapp: {
			number: "(11) 3000-0000",
			message: "Olá! Vim pelo site da São Jorge Alimentos.",
		},
		// Só entram perfis que existem: um link para a raiz da plataforma leva o
		// visitante para lugar nenhum e enfraquece o `sameAs` do JSON-LD.
		social: [
			{
				platform: "instagram",
				href: "https://www.instagram.com/saojorgealimentos/",
			},
			{
				platform: "facebook",
				href: "https://www.facebook.com/profile.php?id=100009943276651",
			},
		],
		contactSubjects: [
			"Atendimento ao consumidor",
			"Quero ser distribuidor",
			"Trabalhe conosco",
			"Imprensa",
		],
	},

	home: {
		hero: {
			title: "Mais sabor\nem sua mesa",
			text: "Há mais de 40 anos levando qualidade e sabor para o dia a dia das famílias brasileiras.",
			imageAlt: "Prato de massa servido à mesa com temperos São Jorge",
		},
		story: {
			title: "Uma história que começa na família",
			text: "Fundada com o propósito de oferecer alimentos de qualidade, a São Jorge Alimentos nasceu de um sonho familiar e hoje está presente na mesa de milhares de pessoas em todo o Brasil.",
			note: "Tudo começou com trabalho, família e propósito.",
			imageAlt: "Fachada e caminhão antigo da São Jorge Alimentos",
		},
		families: {
			title: "Para cada receita,\numa escolha",
			// O canvas original destacava só quatro famílias; as outras só
			// existiam dentro do menu suspenso. Aqui cada uma tem a sua foto.
			representatives: {
				chas: "camomila",
				"ervas-e-especiarias": "oregano",
				"farinhas-naturais": "farinha-de-beterraba",
				institucional: "paprica-doce-1-kg",
				"molhos-e-pastas": "molho-de-alho-jorge-batista-500-ml",
				"sementes-e-graos-naturais": "semente-de-chia",
				"temperos-em-po": "paprica-doce",
				"temperos-liquidos-prontos": "tempero-tradicional-500-ml",
			},
		},
		recipes: {
			title: "Sabor que inspira",
			text: "Receitas práticas, deliciosas e feitas para momentos especiais.",
		},
		values: [
			{
				title: "Ingredientes selecionados",
				text: "Ervas, grãos e especiarias escolhidos para chegar à sua cozinha com todo o sabor.",
			},
			{
				title: "Qualidade que você confia",
				text: "O mesmo padrão do sachê de tempero ao saco de 1 kg da linha institucional.",
			},
			{
				title: "Tradição desde 1980",
				text: "Quatro décadas de história de família, da primeira fábrica à mesa de todo o Brasil.",
			},
			{
				title: "Variedade para o dia a dia",
				text: "{produtos} produtos em {familias} famílias, do chá da noite ao tempero do almoço.",
			},
		],
	},

	about: {
		intro: "Nossa história é feita de pessoas e propósito.",
		story: [
			"Fundada com o propósito de oferecer alimentos de qualidade, a São Jorge Alimentos nasceu de um sonho familiar. Começamos pequenos, com um caminhão, uma linha de massas e a convicção de que comida boa aproxima as pessoas.",
			"Ao longo de mais de quatro décadas ampliamos a produção, modernizamos nossas fábricas e crescemos junto com as famílias que confiam na nossa marca. Massas, molhos e temperos passaram a fazer parte do dia a dia de milhares de casas em todo o Brasil.",
			"O que não mudou foi o cuidado: ingredientes selecionados, processos rigorosos e o compromisso de levar mais sabor para a sua mesa.",
		],
		timelineTitle: "De 1980 até a sua mesa",
		timeline: [
			{
				year: "1980",
				title: "Primeiros passos",
				text: "A família inicia a produção artesanal de massas em uma pequena fábrica.",
			},
			{
				year: "1990",
				title: "Primeira frota",
				text: "A distribuição própria leva os produtos para toda a região.",
			},
			{
				year: "2000",
				title: "Nova fábrica",
				text: "Ampliação da produção e chegada da linha de molhos.",
			},
			{
				year: "2010",
				title: "Linha completa",
				text: "Massas, molhos e temperos formam a família de produtos.",
			},
			{
				year: "Atualmente",
				title: "Presença nacional",
				text: "Milhares de famílias brasileiras à mesa todos os dias.",
			},
		],
	},

	privacy: completar(POLITICA_DE_PRIVACIDADE),
	cookies: completar(POLITICA_DE_COOKIES),
};
