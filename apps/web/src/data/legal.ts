/** Legal page copy, transcribed from the approved design canvas. */

export interface LegalCard {
	readonly title: string;
	readonly text: string;
}

export interface LegalSection {
	/** Omit on the opening paragraph, which has no heading. */
	readonly heading?: string;
	readonly paragraphs?: readonly string[];
	readonly cards?: readonly LegalCard[];
}

export interface LegalDocument {
	readonly title: string;
	readonly updatedAt: string;
	readonly summary: string;
	readonly sections: readonly LegalSection[];
}

export const PRIVACY_POLICY: LegalDocument = {
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

export const COOKIE_POLICY: LegalDocument = {
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
