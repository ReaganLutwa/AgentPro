import { createRouter, authedQuery } from "./middleware";
import { TRPCError } from "@trpc/server";
import { getDb } from "./queries/connection";
import { agencyMembers, users, checkins } from "@db/schema";
import { eq } from "drizzle-orm";
import {
  getMembership, getTxns, startOfToday, startOfMonth, hasCheckedIn,
} from "./queries/agency";

export const teamRouter = createRouter({
  members: authedQuery.query(async ({ ctx }) => {
    const m = await getMembership(ctx.user.id);
    if (!m) throw new TRPCError({ code: "FORBIDDEN" });
    const db = getDb();
    const members = await db.query.agencyMembers.findMany({
      where: eq(agencyMembers.agencyId, m.agency.id),
    });
    const isOwner = m.member.role === "owner";
    const visible = isOwner ? members : members.filter((mm) => mm.id === m.member.id);

    const today = startOfToday();
    const month = startOfMonth();
    const dayKey = today.toISOString().slice(0, 10);
    const monthTxns = await getTxns(m.agency.id, month);

    const out = [];
    for (const mem of visible) {
      const [u] = await db.select().from(users).where(eq(users.id, mem.userId)).limit(1);
      const mine = monthTxns.filter((t) => t.memberId === mem.id);
      const mineToday = mine.filter((t) => t.createdAt >= today);
      out.push({
        memberId: mem.id,
        name: u?.name ?? "Member",
        role: mem.role,
        isYou: mem.id === m.member.id,
        checkedInToday: await hasCheckedIn(mem.id, dayKey),
        todayTxns: mineToday.length,
        todayCommission: mineToday.reduce((s, t) => s + t.commission, 0),
        monthTxns: mine.length,
        monthCommission: mine.reduce((s, t) => s + t.commission, 0),
      });
    }
    return out;
  }),

  checkIn: authedQuery.mutation(async ({ ctx }) => {
    const m = await getMembership(ctx.user.id);
    if (!m) throw new TRPCError({ code: "FORBIDDEN" });
    const dayKey = startOfToday().toISOString().slice(0, 10);
    if (!(await hasCheckedIn(m.member.id, dayKey))) {
      await getDb().insert(checkins).values({
        agencyId: m.agency.id, memberId: m.member.id, day: dayKey,
      });
    }
    return { ok: true, day: dayKey };
  }),
});
