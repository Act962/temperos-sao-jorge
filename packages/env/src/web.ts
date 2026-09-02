import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	clientPrefix: "VITE_",
	client: {
		/** Public origin of the marketing site — canonical URLs, OG tags, sitemap. */
		VITE_SITE_URL: z.url().default("https://alimentossaojorge.com"),
	},
	// `import.meta.env` é tipado pelo client do Vite, incluído no tsconfig.
	runtimeEnv: import.meta.env,
	emptyStringAsUndefined: true,
});
