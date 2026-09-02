import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	clientPrefix: "VITE_",
	client: {
		/** Public origin of the marketing site — canonical URLs, OG tags, sitemap. */
		VITE_SITE_URL: z.url().default("https://alimentossaojorge.com"),
	},
	// Este pacote não depende do Vite, então `import.meta.env` não vem tipado
	// aqui. O recorte abaixo descreve exatamente o que é consumido, em vez de
	// abrir mão da checagem com `any`.
	runtimeEnv: (
		import.meta as ImportMeta & { env: Record<string, string | undefined> }
	).env,
	emptyStringAsUndefined: true,
});
