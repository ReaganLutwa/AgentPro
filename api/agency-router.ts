import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { TRPCError } from "@trpc/server";
import { getDb } from "./queries/connection";
import { agencies, moneyLines } from "@db/schema";
import { eq, and } from "drizzle-orm";
import {
  getMembership, createAgency, joinAgency, getLinesWithBalances,
} from "./queries/agency";

export const agencyRouter = createRouter({
  me: authedQuery.query(async ({ ctx }) => {
    const m = await getMembership(ctx.user.id);
    if (!m) return { membership: null };
    const lines = await getLinesWithBalances(m.agency.id);
    return {
      membership: {
        agency: m.agency,
        role: m.member.role,
        memberId: m.member.id,
        lines,
      },
    };
  }),

  create: authedQuery
    .input(z.object({
      name: z.string().min(2).max(100),
      currency: z.string().min(3).max(5).default("UGX"),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await getMembership(ctx.user.id);
      if (existing) throw new TRPCError({ code: "BAD_REQUEST", message: "Already in an agency" });
      const id = await createAgency(ctx.user.id, input.name, input.currency.toUpperCase());
      return { agencyId: id };
    }),

  join: authedQuery
    .input(z.object({ inviteCode: z.string().min(4).max(16) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await getMembership(ctx.user.id);
      if (existing) throw new TRPCError({ code: "BAD_REQUEST", message: "Already in an agency" });
      const id = await joinAgency(ctx.user.id, input.inviteCode);
      if (!id) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid invite code" });
      return { agencyId: id };
    }),

  addLine: authedQuery
    .input(z.object({
      name: z.string().min(2).max(60),
      kind: z.enum(["momo", "bank"]).default("momo"),
      openingBalance: z.number().int().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const m = await getMembership(ctx.user.id);
      if (!m) throw new TRPCError({ code: "FORBIDDEN" });
      await getDb().insert(moneyLines).values({
        agencyId: m.agency.id, name: input.name, kind: input.kind,
        openingBalance: input.openingBalance,
      });
      return { ok: true };
    }),

  deleteLine: authedQuery
    .input(z.object({ lineId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const m = await getMembership(ctx.user.id);
      if (!m || m.member.role !== "owner") throw new TRPCError({ code: "FORBIDDEN" });
      await getDb().delete(moneyLines).where(
        and(eq(moneyLines.id, input.lineId), eq(moneyLines.agencyId, m.agency.id)));
      return { ok: true };
    }),

  updateSettings: authedQuery
    .input(z.object({
      name: z.string().min(2).max(100).optional(),
      currency: z.string().min(3).max(5).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const m = await getMembership(ctx.user.id);
      if (!m || m.member.role !== "owner") throw new TRPCError({ code: "FORBIDDEN" });
      const set: Record<string, string> = {};
      if (input.name) set.name = input.name;
      if (input.currency) set.currency = input.currency.toUpperCase();
      if (Object.keys(set).length) {
        await getDb().update(agencies).set(set).where(eq(agencies.id, m.agency.id));
      }
      return { ok: true };
    }),
});
