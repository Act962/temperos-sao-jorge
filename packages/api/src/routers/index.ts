import { publicProcedure, router } from "../index";
import { catalogRouter } from "./catalog";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => "OK"),
	catalog: catalogRouter,
});

export type AppRouter = typeof appRouter;
