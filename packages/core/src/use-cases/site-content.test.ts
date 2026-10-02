import { beforeEach, describe, expect, it } from "vitest";
import { InvalidInputError } from "../domain/errors";
import {
	preencherContagens,
	telefoneInternacional,
} from "../domain/site-content";
import { CONTEUDO_PADRAO } from "../domain/site-content-defaults";
import { InMemorySiteContentRepository } from "../testing/in-memory-repositories";
import {
	obterConteudoDoSite,
	resolverConteudo,
	salvarConteudo,
} from "./site-content";

let repo: InMemorySiteContentRepository;

beforeEach(() => {
	repo = new InMemorySiteContentRepository();
});

const PADRAO = CONTEUDO_PADRAO;

describe("conteúdo padrão", () => {
	it("passa pelos próprios normalizadores sem mudar", () => {
		// O padrão é o que a tela abre e regrava: se ele não fosse aceito, a
		// primeira gravação de qualquer documento falharia sem ninguém ter
		// mexido em nada.
		expect(resolverConteudo({ ...PADRAO })).toEqual(PADRAO);
	});

	it("é o que o site mostra enquanto nada foi salvo", async () => {
		expect(await obterConteudoDoSite(repo)).toEqual(PADRAO);
	});
});

describe("configurações", () => {
	it("grava o documento aparado e ele passa a valer", async () => {
		await salvarConteudo(repo, "settings", {
			...PADRAO.settings,
			contact: { ...PADRAO.settings.contact, phone: "  (11) 4002-8922 " },
		});

		const { settings } = await obterConteudoDoSite(repo);
		expect(settings.contact.phone).toBe("(11) 4002-8922");
		// Os outros documentos continuam no padrão.
		expect((await obterConteudoDoSite(repo)).home).toEqual(PADRAO.home);
	});

	it("recusa e-mail sem arroba", async () => {
		await expect(
			salvarConteudo(repo, "settings", {
				...PADRAO.settings,
				contact: { ...PADRAO.settings.contact, email: "sac.saojorge.com" },
			}),
		).rejects.toThrow(/E-mail de contato inválido/);
	});

	it("recusa telefone sem DDD", async () => {
		await expect(
			salvarConteudo(repo, "settings", {
				...PADRAO.settings,
				contact: { ...PADRAO.settings.contact, phone: "3000-0000" },
			}),
		).rejects.toThrow(/Telefone incompleto/);
	});

	it("aceita WhatsApp em branco, que esconde o botão", async () => {
		const salvo = await salvarConteudo(repo, "settings", {
			...PADRAO.settings,
			whatsapp: { ...PADRAO.settings.whatsapp, number: "   " },
		});
		expect(salvo.whatsapp.number).toBe("");
	});

	it("recusa WhatsApp pela metade", async () => {
		await expect(
			salvarConteudo(repo, "settings", {
				...PADRAO.settings,
				whatsapp: { ...PADRAO.settings.whatsapp, number: "99999-0000" },
			}),
		).rejects.toThrow(/WhatsApp incompleto/);
	});

	it("recusa rede social que não é o endereço completo do perfil", async () => {
		// Link para a raiz da plataforma leva a lugar nenhum e enfraquece o
		// `sameAs` do JSON-LD.
		for (const href of [
			"instagram.com/saojorge",
			"http://www.instagram.com/saojorge",
			"https://www.instagram.com/",
		]) {
			await expect(
				salvarConteudo(repo, "settings", {
					...PADRAO.settings,
					social: [{ platform: "instagram", href }],
				}),
			).rejects.toThrow(/endereço completo do perfil/);
		}
	});

	it("recusa a mesma rede duas vezes", async () => {
		await expect(
			salvarConteudo(repo, "settings", {
				...PADRAO.settings,
				social: [
					{ platform: "instagram", href: "https://www.instagram.com/a/" },
					{ platform: "instagram", href: "https://www.instagram.com/b/" },
				],
			}),
		).rejects.toThrow(/mais de uma vez/);
	});

	it("aceita ficar sem rede social nenhuma", async () => {
		const salvo = await salvarConteudo(repo, "settings", {
			...PADRAO.settings,
			social: [],
		});
		expect(salvo.social).toEqual([]);
	});

	it("descarta assunto em branco e repetido, e exige ao menos um", async () => {
		const salvo = await salvarConteudo(repo, "settings", {
			...PADRAO.settings,
			contactSubjects: ["Imprensa", "  ", "Imprensa", "Parcerias"],
		});
		expect(salvo.contactSubjects).toEqual(["Imprensa", "Parcerias"]);

		await expect(
			salvarConteudo(repo, "settings", {
				...PADRAO.settings,
				contactSubjects: ["", " "],
			}),
		).rejects.toThrow(/pelo menos um assunto/);
	});

	it("normaliza a UF e recusa a que não tem duas letras", async () => {
		const salvo = await salvarConteudo(repo, "settings", {
			...PADRAO.settings,
			contact: { ...PADRAO.settings.contact, state: " pi " },
		});
		expect(salvo.contact.state).toBe("PI");

		await expect(
			salvarConteudo(repo, "settings", {
				...PADRAO.settings,
				contact: { ...PADRAO.settings.contact, state: "Piauí" },
			}),
		).rejects.toThrow(InvalidInputError);
	});
});

describe("telefone para link", () => {
	it("acrescenta o código do país ao número com DDD", () => {
		expect(telefoneInternacional("(86) 99999-0000")).toBe("5586999990000");
		expect(telefoneInternacional("(11) 3000-0000")).toBe("551130000000");
	});

	it("não duplica o código de quem já digitou", () => {
		expect(telefoneInternacional("+55 86 99999-0000")).toBe("5586999990000");
	});
});

describe("página inicial", () => {
	it("exige exatamente quatro compromissos", async () => {
		// O site tem um ícone fixo por posição.
		await expect(
			salvarConteudo(repo, "home", {
				...PADRAO.home,
				values: PADRAO.home.values.slice(0, 3),
			}),
		).rejects.toThrow(/exatamente 4 compromissos/);
	});

	it("recusa abertura sem título", async () => {
		await expect(
			salvarConteudo(repo, "home", {
				...PADRAO.home,
				hero: { ...PADRAO.home.hero, title: "  " },
			}),
		).rejects.toThrow(/abertura precisa de um título/);
	});

	it("preserva a quebra de linha do título", async () => {
		const salvo = await salvarConteudo(repo, "home", {
			...PADRAO.home,
			hero: { ...PADRAO.home.hero, title: "Tempero bom\nde verdade" },
		});
		expect(salvo.hero.title).toBe("Tempero bom\nde verdade");
	});

	it("descarta representante deixado em branco", async () => {
		const salvo = await salvarConteudo(repo, "home", {
			...PADRAO.home,
			families: {
				...PADRAO.home.families,
				representatives: { chas: "boldo", institucional: " " },
			},
		});
		expect(salvo.families.representatives).toEqual({ chas: "boldo" });
	});

	it("troca as marcas de contagem pelo número do catálogo", () => {
		expect(
			preencherContagens("{produtos} produtos em {familias} famílias", {
				produtos: 106,
				familias: 9,
			}),
		).toBe("106 produtos em 9 famílias");
	});
});

describe("página sobre", () => {
	it("descarta parágrafo em branco e exige ao menos um", async () => {
		const salvo = await salvarConteudo(repo, "about", {
			...PADRAO.about,
			story: ["Primeiro.", "", "  Segundo.  "],
		});
		expect(salvo.story).toEqual(["Primeiro.", "Segundo."]);

		await expect(
			salvarConteudo(repo, "about", { ...PADRAO.about, story: [" "] }),
		).rejects.toThrow(/pelo menos um parágrafo/);
	});

	it("mantém a ordem dos marcos e recusa marco incompleto", async () => {
		const salvo = await salvarConteudo(repo, "about", {
			...PADRAO.about,
			timeline: [
				{ year: "2020", title: "Nova linha", text: "Chegam os chás." },
				...PADRAO.about.timeline,
			],
		});
		expect(salvo.timeline[0]?.year).toBe("2020");
		expect(salvo.timeline).toHaveLength(PADRAO.about.timeline.length + 1);

		await expect(
			salvarConteudo(repo, "about", {
				...PADRAO.about,
				timeline: [{ year: "2020", title: "", text: "Sem título." }],
			}),
		).rejects.toThrow(/marco 1 precisa de título/);
	});

	it("recusa linha do tempo vazia", async () => {
		await expect(
			salvarConteudo(repo, "about", { ...PADRAO.about, timeline: [] }),
		).rejects.toThrow(/pelo menos um marco/);
	});
});

describe("documentos legais", () => {
	it("grava privacidade e cookies em chaves separadas", async () => {
		await salvarConteudo(repo, "privacy", {
			...PADRAO.privacy,
			updatedAt: "outubro de 2026",
		});

		const conteudo = await obterConteudoDoSite(repo);
		expect(conteudo.privacy.updatedAt).toBe("outubro de 2026");
		expect(conteudo.cookies).toEqual(PADRAO.cookies);
	});

	it("recusa seção vazia, dizendo qual", async () => {
		await expect(
			salvarConteudo(repo, "cookies", {
				...PADRAO.cookies,
				sections: [
					...PADRAO.cookies.sections,
					{ heading: "5. Nova", paragraphs: [" "], cards: [] },
				],
			}),
		).rejects.toThrow(
			`A seção ${PADRAO.cookies.sections.length + 1} está vazia`,
		);
	});

	it("recusa quadro pela metade e descarta o que ficou todo em branco", async () => {
		const base = PADRAO.cookies.sections[0];
		if (!base) throw new Error("o padrão precisa de uma seção");

		const salvo = await salvarConteudo(repo, "cookies", {
			...PADRAO.cookies,
			sections: [{ ...base, cards: [{ title: " ", text: "" }] }],
		});
		expect(salvo.sections[0]?.cards).toEqual([]);

		await expect(
			salvarConteudo(repo, "cookies", {
				...PADRAO.cookies,
				sections: [{ ...base, cards: [{ title: "Essenciais", text: "" }] }],
			}),
		).rejects.toThrow(/todo quadro precisa de título e texto/);
	});
});

describe("documento salvo que o domínio não aceita mais", () => {
	it("vale o padrão em vez de quebrar o site", () => {
		const conteudo = resolverConteudo({
			// Formato antigo: faltam campos inteiros.
			settings: { telefone: "(11) 3000-0000" },
			about: "texto solto",
			home: null,
		});

		expect(conteudo.settings).toEqual(PADRAO.settings);
		expect(conteudo.about).toEqual(PADRAO.about);
		expect(conteudo.home).toEqual(PADRAO.home);
	});

	it("não contamina os documentos que estão bons", async () => {
		await salvarConteudo(repo, "about", {
			...PADRAO.about,
			intro: "Feita de gente.",
		});
		await repo.save("settings", { quebrado: true });

		const conteudo = await obterConteudoDoSite(repo);
		expect(conteudo.about.intro).toBe("Feita de gente.");
		expect(conteudo.settings).toEqual(PADRAO.settings);
	});
});
