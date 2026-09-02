import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

export default defineConfig({
	server: {
		port: 3001,
	},
	preview: {
		port: 3001,
	},
	resolve: {
		tsconfigPaths: true,
	},
	test: {
		// `e2e/` é do Playwright. Sem excluir, o Vitest tentaria rodar os .spec
		// como teste unitário e falharia ao importar @playwright/test.
		exclude: ["**/node_modules/**", "**/dist/**", "e2e/**"],
	},
	plugins: [tailwindcss(), tanstackStart(), viteReact()],
});
