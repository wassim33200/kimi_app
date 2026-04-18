import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const createRouter = t.router;
export const publicQuery = t.procedure;

export const authedQuery = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.student) {
    throw new Error("Unauthorized: Please log in");
  }
  return next({
    ctx: {
      ...ctx,
      student: ctx.student,
    },
  });
});
