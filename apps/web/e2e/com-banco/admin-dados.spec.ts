import { expect, type Page, test } from "@playwright/test";
import { PRODUCT_FAMILIES, PRODUCTS } from "../../src/data/products";
import { RECIPES } from "../../src/data/recipes";

/**
 * O painel lendo e gravando o catálogo de verdade.
 *
 * A suíte sem banco prova que as rotas do admin sobem e barram quem não tem
 * sessão; ela não consegue provar que a tela mostra o dado certo, porque não
 * há dado. É esse buraco que os testes daqui fecham.
 *
 * A expectativa vem dos arquivos publicados em `src/data/`, que são a mesma
 * origem do `catalog:seed`. Assim nenhum número fica escrito à mão: o catálogo
 * pode crescer que o teste acompanha.
 *
 * Os testes rodam em série, na ordem do arquivo: primeiro os que só leem,
 * depois os que gravam — e cada um que grava devolve o banco como encontrou.
 *
 * Desde a spec 0007 salvar é publicar: os testes de escrita conferem também o
 * site público, na mesma rodada, sem comando de publicação nem novo build.
 */

const RECEITA = RECIPES[0];

const itens = (page: Page, lista: string) =>
	page.getByRole("list", { name: lista }).getByRole("listitem");

/** Confirma no diálogo do painel, que substituiu o `confirm()` do navegador. */
const confirmarRemocao = (page: Page) =>
	page
		.getByRole("alertdialog")
		.getByRole("button", { name: "Remover" })
		.click();

test("a visão geral conta o que está no banco", async ({ page }) => {
	await page.goto("/admin");

	const cartao = (rotulo: string) => page.getByRole("group", { name: rotulo });

	await expect(cartao("Produtos")).toContainText(String(PRODUCTS.length));
	await expect(cartao("Famílias")).toContainText(
		String(PRODUCT_FAMILIES.length),
	);
	await expect(cartao("Receitas")).toContainText(String(RECIPES.length));

	// A quebra por família também sai do banco, não de uma contagem guardada.
	for (const familia of PRODUCT_FAMILIES) {
		await expect(page.getByRole("link", { name: familia.name })).toContainText(
			String(PRODUCTS.filter((p) => p.familySlug === familia.slug).length),
		);
	}
});

test("a lista de produtos traz o catálogo inteiro", async ({ page }) => {
	await page.goto("/admin/produtos");

	await expect(
		page.getByText(`${PRODUCTS.length} produtos no catálogo.`),
	).toBeVisible();
	await expect(itens(page, "Produtos")).toHaveCount(PRODUCTS.length);
	await expect(
		page.getByRole("button", { name: `Editar ${PRODUCTS[0].name}` }),
	).toBeVisible();
});

test("o filtro de família vem da URL", async ({ page }) => {
	const familia = PRODUCT_FAMILIES[0];
	const daFamilia = PRODUCTS.filter((p) => p.familySlug === familia.slug);

	await page.goto(`/admin/produtos?familia=${familia.slug}`);

	// Colado no navegador, o link da visão geral tem que abrir já filtrado.
	await expect(
		page.getByText(
			`${daFamilia.length} de ${PRODUCTS.length} produtos — família ${familia.name}.`,
		),
	).toBeVisible();
	await expect(itens(page, "Produtos")).toHaveCount(daFamilia.length);
	await expect(
		page
			.getByRole("navigation", { name: "Filtrar por família" })
			.getByRole("link", { name: familia.name }),
	).toHaveAttribute("aria-current", "true");
	// "Todos" não pode se dizer ativo junto: a busca dele é um subconjunto de
	// qualquer filtro, e o roteador o marcaria se a comparação fosse parcial.
	await expect(
		page
			.getByRole("navigation", { name: "Filtrar por família" })
			.getByRole("link", { name: "Todos" }),
	).not.toHaveAttribute("aria-current");
});

test("a busca ignora acento e fica na URL", async ({ page }) => {
	// "cha" sem acento tem que achar "Chá Verde": é como se digita no celular.
	const esperados = PRODUCTS.filter((p) =>
		p.name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().includes("cha"),
	);
	expect(
		esperados.some((p) => p.name.includes("Chá")),
		"o catálogo precisa ter um produto com 'Chá' no nome",
	).toBeTruthy();

	await page.goto("/admin/produtos");
	await page.getByRole("searchbox", { name: "Buscar produto" }).fill("cha");

	await expect(itens(page, "Produtos")).toHaveCount(esperados.length);
	await expect(page).toHaveURL(/busca=cha/);

	// E o link com a busca abre já filtrado.
	await page.reload();
	await expect(itens(page, "Produtos")).toHaveCount(esperados.length);
});

test("a lista de receitas traz todas as publicadas", async ({ page }) => {
	await page.goto("/admin/receitas");

	await expect(
		page.getByText(`${RECIPES.length} receitas no catálogo.`),
	).toBeVisible();
	await expect(itens(page, "Receitas")).toHaveCount(RECIPES.length);
});

test("a tela de famílias segue a ordem do site", async ({ page }) => {
	await page.goto("/admin/familias");

	const linhas = itens(page, "Famílias");
	await expect(linhas).toHaveCount(PRODUCT_FAMILIES.length);

	for (const [indice, familia] of PRODUCT_FAMILIES.entries()) {
		await expect(linhas.nth(indice)).toContainText(familia.name);
	}
});

test.describe("no celular", () => {
	test.use({ viewport: { width: 390, height: 844 } });

	test("a navegação fica numa gaveta, com a saída dentro", async ({ page }) => {
		await page.goto("/admin");

		const navegacao = page.getByRole("navigation", {
			name: "Seções do painel",
		});
		await expect(navegacao).toBeHidden();

		await page.getByRole("button", { name: "Abrir menu" }).click();

		await expect(
			navegacao.getByRole("link", { name: "Produtos" }),
		).toBeVisible();
		await expect(
			navegacao.getByRole("link", { name: "Famílias" }),
		).toBeVisible();
		await expect(
			navegacao.getByRole("link", { name: "Receitas" }),
		).toBeVisible();
		await expect(page.getByRole("button", { name: "Sair" })).toBeVisible();

		// Escolher uma seção fecha a gaveta: ela não pode cobrir a tela pedida.
		await navegacao.getByRole("link", { name: "Produtos" }).click();
		await expect(page).toHaveURL(/\/admin\/produtos$/);
		await expect(navegacao).toBeHidden();
	});

	for (const [rota, lista] of [
		["/admin/produtos", "Produtos"],
		["/admin/receitas", "Receitas"],
		["/admin/familias", "Famílias"],
	]) {
		test(`${rota} cabe na largura, com as ações à vista`, async ({ page }) => {
			await page.goto(rota);

			const primeiro = itens(page, lista).first();
			await expect(primeiro).toBeVisible();

			// A tabela antiga rolava de lado e escondia editar e remover.
			const sobra = await page.evaluate(
				() =>
					document.documentElement.scrollWidth -
					document.documentElement.clientWidth,
			);
			expect(sobra).toBeLessThanOrEqual(0);

			await expect(
				primeiro.getByRole("button", { name: /^Remover / }),
			).toBeInViewport();
		});
	}
});

test("a edição de receita volta preenchida, e sobrevive ao recarregar", async ({
	page,
}) => {
	await page.goto(`/admin/receitas/${RECEITA.slug}`);

	const conferir = async () => {
		await expect(
			page.getByRole("heading", { name: RECEITA.name }),
		).toBeVisible();

		// Cada ingrediente no seu campo e na sua posição: é a ordem que a
		// publicação grava, então trocar duas linhas mudaria a receita no site.
		for (const [indice, ingrediente] of RECEITA.ingredients.entries()) {
			await expect(
				page.getByLabel(`Ingredientes, item ${indice + 1}`),
			).toHaveValue(ingrediente);
		}

		for (const [indice, passo] of RECEITA.steps.entries()) {
			await expect(
				page.getByLabel(`Modo de preparo, item ${indice + 1}`),
			).toHaveValue(passo);
		}

		for (const slug of RECEITA.usedProductSlugs) {
			const produto = PRODUCTS.find((p) => p.slug === slug);
			await expect(
				page.getByRole("button", { name: `Remover ${produto?.name ?? slug}` }),
			).toBeVisible();
		}
	};

	await conferir();
	await page.reload();
	await conferir();
});

test("recusa remover produto citado, com a frase do domínio", async ({
	page,
}) => {
	const slugCitado = RECEITA.usedProductSlugs[0];
	const citado = PRODUCTS.find((produto) => produto.slug === slugCitado);
	expect(
		citado,
		"a receita de referência precisa citar algum produto",
	).toBeTruthy();

	await page.goto("/admin/produtos");
	await page.getByRole("button", { name: `Remover ${citado?.name}` }).click();

	// O diálogo nomeia o item antes de qualquer gravação.
	await expect(page.getByRole("alertdialog")).toContainText(
		`Remover “${citado?.name}”?`,
	);
	await confirmarRemocao(page);

	// A regra é do domínio e chega inteira à tela: sem isso o autor veria o
	// erro de chave estrangeira do Postgres, ou nada.
	await expect(
		page.getByText(`Não dá para remover "${citado?.name}"`),
	).toBeVisible();
	await expect(page.getByText(`"${RECEITA.name}"`).first()).toBeVisible();

	// E o produto continua lá.
	await page.reload();
	await expect(
		page.getByRole("button", { name: `Editar ${citado?.name}` }),
	).toBeVisible();
});

test("cancelar a confirmação não remove nada", async ({ page }) => {
	const produto = PRODUCTS[0];

	await page.goto("/admin/produtos");
	await page.getByRole("button", { name: `Remover ${produto.name}` }).click();
	await page
		.getByRole("alertdialog")
		.getByRole("button", { name: "Cancelar" })
		.click();

	await expect(page.getByRole("alertdialog")).toHaveCount(0);
	await page.reload();
	await expect(itens(page, "Produtos")).toHaveCount(PRODUCTS.length);
});

test("recusa remover família com produtos, dizendo quantos", async ({
	page,
}) => {
	const familia = PRODUCT_FAMILIES[0];
	const quantos = PRODUCTS.filter((p) => p.familySlug === familia.slug).length;

	await page.goto("/admin/familias");
	await page.getByRole("button", { name: `Remover ${familia.name}` }).click();
	await confirmarRemocao(page);

	await expect(
		page.getByText(
			`Não dá para remover "${familia.name}": ${quantos} produtos ainda estão nesta família.`,
		),
	).toBeVisible();

	await page.reload();
	await expect(itens(page, "Famílias")).toHaveCount(PRODUCT_FAMILIES.length);
});

test("reordenar famílias troca a ordem, e desfazer devolve", async ({
	page,
}) => {
	const [primeira, segunda] = PRODUCT_FAMILIES;

	await page.goto("/admin/familias");
	const linhas = itens(page, "Famílias");

	await page.getByRole("button", { name: `Descer ${primeira.name}` }).click();
	await expect(linhas.nth(0)).toContainText(segunda.name);
	await expect(linhas.nth(1)).toContainText(primeira.name);

	// A ordem é do banco, não da tela: tem que sobreviver ao recarregar.
	await page.reload();
	await expect(linhas.nth(0)).toContainText(segunda.name);

	await page.getByRole("button", { name: `Subir ${primeira.name}` }).click();
	await expect(linhas.nth(0)).toContainText(primeira.name);
});

test("família criada só com o nome entra no fim, e sai quando removida", async ({
	page,
}) => {
	const nome = "Família de Teste do E2E";

	await page.goto("/admin/familias");
	await page.getByRole("button", { name: "Nova família" }).click();
	await page.getByRole("dialog").getByLabel("Nome").fill(nome);
	await page.getByRole("button", { name: "Salvar" }).click();

	const linhas = itens(page, "Famílias");
	await expect(linhas).toHaveCount(PRODUCT_FAMILIES.length + 1);
	await expect(linhas.last()).toContainText(nome);
	await expect(linhas.last()).toContainText("0 produtos");

	// A família nova já tem página no site, antes de qualquer publicação.
	const resposta = await page.request.get("/produtos/familia-de-teste-do-e2e");
	expect(resposta.status()).toBe(200);

	// Renomear não mexe no endereço, que já pode estar publicado.
	await page.getByRole("button", { name: `Renomear ${nome}` }).click();
	await expect(page.getByRole("dialog")).toContainText(
		"/produtos/familia-de-teste-do-e2e",
	);
	await page.getByRole("button", { name: "Cancelar" }).click();

	await page.getByRole("button", { name: `Remover ${nome}` }).click();
	await confirmarRemocao(page);
	await expect(linhas).toHaveCount(PRODUCT_FAMILIES.length);

	// E a página dela some junto.
	const depois = await page.request.get("/produtos/familia-de-teste-do-e2e");
	expect(depois.status()).toBe(404);
});

test("renomear um produto no painel muda o site na visita seguinte", async ({
	page,
}) => {
	const produto = PRODUCTS[0];
	const novoNome = `${produto.name} Renomeado no E2E`;
	const paginaDaFamilia = `/produtos/${produto.familySlug}`;

	const renomear = async (de: string, para: string) => {
		await page.goto("/admin/produtos");
		await page
			.getByRole("button", { name: `Editar ${de}`, exact: true })
			.click();
		const dialogo = page.getByRole("dialog");
		await dialogo.getByLabel("Nome").fill(para);
		await dialogo.getByRole("button", { name: "Salvar" }).click();
		await expect(dialogo).toHaveCount(0);
	};

	// A visita anterior deixa o catálogo no cache do servidor: é contra ele
	// que a gravação tem que valer.
	await page.goto(paginaDaFamilia);
	await expect(
		page.getByRole("heading", { name: produto.name, exact: true }),
	).toBeVisible();

	await renomear(produto.name, novoNome);

	// Requisição crua, sem o cache de consulta do navegador: o que se confere
	// é o HTML que o servidor entrega a um visitante novo.
	const html = await (await page.request.get(paginaDaFamilia)).text();
	expect(html).toContain(novoNome);

	await renomear(novoNome, produto.name);
	const restaurado = await (await page.request.get(paginaDaFamilia)).text();
	expect(restaurado).not.toContain(novoNome);
});

test("produto criado só com nome e família entra no fim da lista", async ({
	page,
}) => {
	const nome = "Produto de Teste do E2E";
	const familia = PRODUCT_FAMILIES[0];
	const daFamilia = PRODUCTS.filter((p) => p.familySlug === familia.slug);

	// Criar a partir da lista filtrada já sugere a família.
	await page.goto(`/admin/produtos?familia=${familia.slug}`);
	const dialogo = page.getByRole("dialog");
	await page.getByRole("button", { name: "Novo produto" }).click();
	await expect(dialogo.getByLabel("Família")).toHaveValue(familia.slug);
	await dialogo.getByLabel("Nome").fill(nome);
	await dialogo.getByRole("button", { name: "Salvar" }).click();

	const linhas = itens(page, "Produtos");
	await expect(linhas).toHaveCount(daFamilia.length + 1);
	await expect(linhas.last()).toContainText(nome);

	// O mesmo nome deriva o mesmo slug: a segunda tentativa é recusada pelo
	// domínio, dentro do diálogo.
	await page.getByRole("button", { name: "Novo produto" }).click();
	await dialogo.getByLabel("Nome").fill(nome);
	await dialogo.getByRole("button", { name: "Salvar" }).click();
	await expect(dialogo.getByRole("alert")).toContainText(
		'Já existe um produto com o slug "produto-de-teste-do-e2e"',
	);
	await dialogo.getByRole("button", { name: "Cancelar" }).click();

	await page.getByRole("button", { name: `Remover ${nome}` }).click();
	await confirmarRemocao(page);
	await expect(linhas).toHaveCount(daFamilia.length);
});

test("criar uma receita desemboca na edição dela", async ({ page }) => {
	const slug = "receita-de-teste-do-e2e";
	const nome = "Receita de Teste";

	await page.goto("/admin/receitas/nova");

	// O endereço acompanha o nome enquanto ninguém mexe nele.
	await page.getByLabel("Nome").fill(nome);
	await expect(page.getByLabel("Endereço no site")).toHaveValue(
		"receita-de-teste",
	);

	await page.getByLabel("Endereço no site").fill(slug);
	await page.getByLabel("Ingredientes, item 1").fill("1 pitada de sal");
	await page.getByLabel("Modo de preparo, item 1").fill("Misture tudo.");
	await page.getByRole("button", { name: "Salvar receita" }).click();

	// O ponto do teste: quem acabou de escrever continua na receita, na URL
	// dela, em vez de ser mandado de volta para a lista para procurá-la.
	await expect(page).toHaveURL(new RegExp(`/admin/receitas/${slug}$`));
	await expect(page.getByRole("heading", { name: nome })).toBeVisible();
	await expect(page.getByLabel("Ingredientes, item 1")).toHaveValue(
		"1 pitada de sal",
	);

	// Salvar é publicar: a receita responde no site e entra no sitemap.
	const publica = await page.request.get(`/receitas/${slug}`);
	expect(publica.status()).toBe(200);
	expect(await publica.text()).toContain(nome);
	const sitemap = await (await page.request.get("/sitemap.xml")).text();
	expect(sitemap).toContain(`/receitas/${slug}</loc>`);

	// Voltar cairia num formulário de criação já enviado, que reenviaria em
	// conflito de slug — por isso a navegação substitui a entrada no histórico.
	await page.goBack();
	await expect(page).not.toHaveURL(/\/admin\/receitas\/nova$/);

	// Devolve o banco como estava. A carga do preparo apagaria a sobra na
	// próxima rodada de qualquer forma, mas um teste que suja o banco e conta
	// com isso obriga quem for depurar a rodar a suíte inteira. De quebra, a
	// remoção pela tela também entra na cobertura.
	await page.goto("/admin/receitas");
	await page.getByRole("button", { name: `Remover ${nome}` }).click();
	await confirmarRemocao(page);
	await expect(page.getByRole("link", { name: `Editar ${nome}` })).toHaveCount(
		0,
	);

	const removida = await page.request.get(`/receitas/${slug}`);
	expect(removida.status()).toBe(404);
});
