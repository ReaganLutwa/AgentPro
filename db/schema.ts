import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// TODO: Add your tables here. See docs/Database.md for schema examples and patterns.
//
// Example:
// export const posts = mysqlTable("posts", {
//   id: serial("id").primaryKey(),
//   title: varchar("title", { length: 255 }).notNull(),
//   content: text("content"),
//   createdAt: timestamp("created_at").notNull().defaultNow(),
// });
//
// Note: FK columns referencing a serial() PK must use:
//   bigint("columnName", { mode: "number", unsigned: true }).notNull()

// ---------------- AgentPro tables ----------------

export const agencies = mysqlTable("agencies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  currency: varchar("currency", { length: 8 }).default("UGX").notNull(),
  inviteCode: varchar("inviteCode", { length: 16 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Agency = typeof agencies.$inferSelect;

export const agencyMembers = mysqlTable("agency_members", {
  id: serial("id").primaryKey(),
  agencyId: bigint("agencyId", { mode: "number", unsigned: true }).notNull(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  role: mysqlEnum("role", ["owner", "staff"]).default("staff").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AgencyMember = typeof agencyMembers.$inferSelect;

export const moneyLines = mysqlTable("money_lines", {
  id: serial("id").primaryKey(),
  agencyId: bigint("agencyId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  kind: mysqlEnum("kind", ["momo", "bank"]).default("momo").notNull(),
  openingBalance: bigint("openingBalance", { mode: "number" }).default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MoneyLine = typeof moneyLines.$inferSelect;

export const transactions = mysqlTable("transactions", {
  id: serial("id").primaryKey(),
  agencyId: bigint("agencyId", { mode: "number", unsigned: true }).notNull(),
  memberId: bigint("memberId", { mode: "number", unsigned: true }).notNull(),
  lineId: bigint("lineId", { mode: "number", unsigned: true }).notNull(),
  type: mysqlEnum("type", ["WITHDRAWAL", "DEPOSIT", "AIRTIME", "FLOAT_BUY", "ADJUSTMENT"]).notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  commission: bigint("commission", { mode: "number" }).default(0).notNull(),
  note: varchar("note", { length: 500 }).default("").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Transaction = typeof transactions.$inferSelect;

export const checkins = mysqlTable("checkins", {
  id: serial("id").primaryKey(),
  agencyId: bigint("agencyId", { mode: "number", unsigned: true }).notNull(),
  memberId: bigint("memberId", { mode: "number", unsigned: true }).notNull(),
  day: varchar("day", { length: 10 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Checkin = typeof checkins.$inferSelect;
