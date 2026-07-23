import { authRouter } from "./auth-router";
import { agencyRouter } from "./agency-router";
import { txnRouter } from "./txn-router";
import { teamRouter } from "./team-router";
import { reportRouter } from "./report-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  agency: agencyRouter,
  txn: txnRouter,
  team: teamRouter,
  report: reportRouter,

  // TODO: add feature routers here, e.g.
  // todo: createRouter({
  //   list: publicQuery.query(() => findTodos()),
  // }),
});

export type AppRouter = typeof appRouter;
