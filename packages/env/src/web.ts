import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	clientPrefix: "VITE_",
	client: {
		VITE_SERVER_URL: z.url(),
		/** Public origin of the marketing site — canonical URLs, OG tags, sitemap. */
		VITE_SITE_URL: z.url().default("https://alimentossaojorge.com"),
	},
	runtimeEnv: (import.meta as any).env,
	emptyStringAsUndefined: true,
});
