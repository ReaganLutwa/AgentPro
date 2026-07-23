import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { TRPCError } from "@trpc/server";
import { getMembership, getTxns } from "./queries/agency";

export const reportRouter = createRouter({
  summary: authedQuery
    .input(z.object({
      from: z.date(),
      to: z.date(),
    }))
    .query(async ({ ctx, input }) => {
      const m = await getMembership(ctx.user.id);
      if (!m) throw new TRPCError({ code: "FORBIDDEN" });
      const all = await getTxns(m.agency.id, input.from);
      const txns = all.filter((t) => t.createdAt <= input.to);

      const byMember = new Map<number, { count: number; volume: number; commission: number }>();
      const byLine = new Map<number, { count: number; volume: number; commission: number }>();
      for (const t of txns) {
        const vol = t.type === "ADJUSTMENT" ? 0 : Math.abs(t.amount);
        const mb = byMember.get(t.memberId) ?? { count: 0, volume: 0, commission: 0 };
        mb.count++; mb.volume += vol; mb.commission += t.commission;
        byMember.set(t.memberId, mb);
        const lb = byLine.get(t.lineId) ?? { count: 0, volume: 0, commission: 0 };
        lb.count++; lb.volume += vol; lb.commission += t.commission;
        byLine.set(t.lineId, lb);
      }
      return {
        totalTxns: txns.length,
        totalVolume: txns.reduce((s, t) => s + (t.type === "ADJUSTMENT" ? 0 : Math.abs(t.amount)), 0),
        totalCommission: txns.reduce((s, t) => s + t.commission, 0),
        byMember: Object.fromEntries(byMember),
        byLine: Object.fromEntries(byLine),
      };
    }),
});
