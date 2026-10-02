import { publicProcedure, router } from "../index";
import { catalogRouter } from "./catalog";
import { contentRouter } from "./content";
import { imagesRouter } from "./images";
import { usersRouter } from "./users";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => "OK"),
	catalog: catalogRouter,
	conteudo: contentRouter,
	imagens: imagesRouter,
	usuarios: usersRouter,
});

export type AppRouter = typeof appRouter;
