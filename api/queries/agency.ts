import { getDb } from "./connection";
import { agencies, agencyMembers, moneyLines, transactions, checkins } from "@db/schema";
import { eq, and, gte, desc } from "drizzle-orm";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function genInviteCode(): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return s;
}

export function txnEffect(type: string, amount: number): number {
  switch (type) {
    case "WITHDRAWAL":
    case "FLOAT_BUY":
    case "ADJUSTMENT":
      return amount;
    case "DEPOSIT":
    case "AIRTIME":
      return -amount;
    default:
      return 0;
  }
}

export async function getMembership(userId: number) {
  const db = getDb();
  const rows = await db
    .select({ member: agencyMembers, agency: agencies })
    .from(agencyMembers)
    .innerJoin(agencies, eq(agencyMembers.agencyId, agencies.id))
    .where(eq(agencyMembers.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

export async function createAgency(userId: number, name: string, currency: string) {
  const db = getDb();
  const [{ id: agencyId }] = await db
    .insert(agencies)
    .values({ name, currency, inviteCode: genInviteCode() })
    .$returningId();
  await db.insert(agencyMembers).values({ agencyId, userId, role: "owner" });
  const defaults: Array<[string, "momo" | "bank"]> = [
    ["MTN MoMo", "momo"],
    ["Airtel Money", "momo"],
    ["Mobile Banking", "bank"],
  ];
  for (const [n, kind] of defaults) {
    await db.insert(moneyLines).values({ agencyId, name: n, kind, openingBalance: 0 });
  }
  return agencyId;
}

export async function joinAgency(userId: number, inviteCode: string) {
  const db = getDb();
  const agency = await db.query.agencies.findFirst({
    where: eq(agencies.inviteCode, inviteCode.trim().toUpperCase()),
  });
  if (!agency) return null;
  await db.insert(agencyMembers).values({ agencyId: agency.id, userId, role: "staff" });
  return agency.id;
}

export async function getLinesWithBalances(agencyId: number) {
  const db = getDb();
  const lines = await db.query.moneyLines.findMany({
    where: eq(moneyLines.agencyId, agencyId),
  });
  const txns = await db.query.transactions.findMany({
    where: eq(transactions.agencyId, agencyId),
  });
  return lines.map((l) => {
    const delta = txns
      .filter((t) => t.lineId === l.id)
      .reduce((sum, t) => sum + txnEffect(t.type, t.amount), 0);
    return { ...l, balance: l.openingBalance + delta };
  });
}

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfMonth(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getTxns(agencyId: number, from?: Date) {
  const db = getDb();
  const cond = from
    ? and(eq(transactions.agencyId, agencyId), gte(transactions.createdAt, from))
    : eq(transactions.agencyId, agencyId);
  return db.query.transactions.findMany({ where: cond, orderBy: [desc(transactions.createdAt)] });
}

export async function hasCheckedIn(memberId: number, day: string) {
  const db = getDb();
  const r = await db.query.checkins.findFirst({
    where: and(eq(checkins.memberId, memberId), eq(checkins.day, day)),
  });
  return !!r;
}
