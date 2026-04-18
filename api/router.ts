import { createRouter, publicQuery } from "./middleware";
import { studentRouter } from "./studentRouter";
import { depotRouter } from "./depotRouter";
import { reservationRouter } from "./reservationRouter";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  student: studentRouter,
  depot: depotRouter,
  reservation: reservationRouter,
});

export type AppRouter = typeof appRouter;
