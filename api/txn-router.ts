import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { TRPCError } from "@trpc/server";
import { getDb } from "./queries/connection";
import { transactions } from "@db/schema";
import { getMembership, getTxns, startOfToday } from "./queries/agency";
import { users, agencyMembers } from "@db/schema";
import { eq, inArray } from "drizzle-orm";

export const txnRouter = createRouter({
  add: authedQuery
    .input(z.object({
      lineId: z.number(),
      type: z.enum(["WITHDRAWAL", "DEPOSIT", "AIRTIME", "FLOAT_BUY", "ADJUSTMENT"]),
      amount: z.number().int().refine((v) => v !== 0, "Amount cannot be zero"),
      commission: z.number().int().min(0).default(0),
      note: z.string().max(400).default(""),
    }))
    .mutation(async ({ ctx, input }) => {
      const m = await getMembership(ctx.user.id);
      if (!m) throw new TRPCError({ code: "FORBIDDEN", message: "No agency" });
      await getDb().insert(transactions).values({
        agencyId: m.agency.id,
        memberId: m.member.id,
        lineId: input.lineId,
        type: input.type,
        amount: input.amount,
        commission: input.commission,
        note: input.note,
      });
      return { ok: true };
    }),

  list: authedQuery
    .input(z.object({
      lineId: z.number().optional(),
      todayOnly: z.boolean().default(false),
    }).optional())
    .query(async ({ ctx, input }) => {
      const m = await getMembership(ctx.user.id);
      if (!m) throw new TRPCError({ code: "FORBIDDEN" });
      const from = input?.todayOnly ? startOfToday() : undefined;
      let txns = await getTxns(m.agency.id, from);
      if (input?.lineId) txns = txns.filter((t) => t.lineId === input.lineId);
      // attach member names
      const members = await getDb().query.agencyMembers.findMany({
        where: eq(agencyMembers.agencyId, m.agency.id),
      });
      const userIds = members.map((mm) => mm.userId);
      const us = userIds.length
        ? await getDb().select().from(users).where(inArray(users.id, userIds))
        : [];
      const nameOf = (memberId: number) => {
        const mem = members.find((mm) => mm.id === memberId);
        const u = us.find((uu) => uu.id === mem?.userId);
        return u?.name ?? "Member";
      };
      return txns.slice(0, 200).map((t) => ({ ...t, memberName: nameOf(t.memberId) }));
    }),
});
