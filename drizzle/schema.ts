import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json, date, bigint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
// Enhanced users table with security fields
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }).default("email"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  planId: int("planId").references(() => plans.id),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["active", "canceled", "past_due", "trial"]).default("trial"),
  trialEndsAt: timestamp("trialEndsAt"),
  subscriptionEndsAt: timestamp("subscriptionEndsAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Plans (Free, Pro, Premium)
export const plans = mysqlTable("plans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).unique().notNull(),
  priceMonthly: decimal("priceMonthly", { precision: 10, scale: 2 }),
  priceAnnual: decimal("priceAnnual", { precision: 10, scale: 2 }),
  maxStrategies: int("maxStrategies"),
  backtestDaysLimit: int("backtestDaysLimit").default(-1),
  paperTradingEnabled: boolean("paperTradingEnabled").default(true),
  realtimeDataEnabled: boolean("realtimeDataEnabled").default(false),
  liveExecutionEnabled: boolean("liveExecutionEnabled").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Plan = typeof plans.$inferSelect;
export type InsertPlan = typeof plans.$inferInsert;

// Strategies
export const strategies = mysqlTable("strategies", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  asset: varchar("asset", { length: 10 }).notNull(),
  status: mysqlEnum("status", ["draft", "active", "paused", "archived"]).default("draft"),
  blocks: json("blocks"),
  connections: json("connections"),
  maxDrawdown: decimal("maxDrawdown", { precision: 5, scale: 2 }),
  maxLossPerTrade: decimal("maxLossPerTrade", { precision: 5, scale: 2 }),
  riskPerTrade: decimal("riskPerTrade", { precision: 5, scale: 2 }),
  paperTradingActive: boolean("paperTradingActive").default(false),
  liveExecutionActive: boolean("liveExecutionActive").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Strategy = typeof strategies.$inferSelect;
export type InsertStrategy = typeof strategies.$inferInsert;

// Backtests
export const backtests = mysqlTable("backtests", {
  id: int("id").autoincrement().primaryKey(),
  strategyId: int("strategyId").notNull().references(() => strategies.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  totalTrades: int("totalTrades"),
  winningTrades: int("winningTrades"),
  losingTrades: int("losingTrades"),
  winRate: decimal("winRate", { precision: 5, scale: 2 }),
  totalReturn: decimal("totalReturn", { precision: 10, scale: 2 }),
  maxDrawdown: decimal("maxDrawdown", { precision: 5, scale: 2 }),
  sharpeRatio: decimal("sharpeRatio", { precision: 5, scale: 2 }),
  profitFactor: decimal("profitFactor", { precision: 5, scale: 2 }),
  initialCapital: decimal("initialCapital", { precision: 15, scale: 2 }).default("10000.00"),
  finalCapital: decimal("finalCapital", { precision: 15, scale: 2 }),
  trades: json("trades"),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type Backtest = typeof backtests.$inferSelect;
export type InsertBacktest = typeof backtests.$inferInsert;

// Paper Trades
export const paperTrades = mysqlTable("paperTrades", {
  id: int("id").autoincrement().primaryKey(),
  strategyId: int("strategyId").notNull().references(() => strategies.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  asset: varchar("asset", { length: 10 }).notNull(),
  type: mysqlEnum("type", ["buy", "sell"]).notNull(),
  quantity: int("quantity").notNull(),
  entryPrice: decimal("entryPrice", { precision: 10, scale: 2 }).notNull(),
  entryTime: timestamp("entryTime").notNull(),
  exitPrice: decimal("exitPrice", { precision: 10, scale: 2 }),
  exitTime: timestamp("exitTime"),
  status: mysqlEnum("status", ["open", "closed", "canceled"]).default("open"),
  profitLoss: decimal("profitLoss", { precision: 15, scale: 2 }),
  profitLossPercent: decimal("profitLossPercent", { precision: 5, scale: 2 }),
  entryReason: varchar("entryReason", { length: 255 }),
  exitReason: varchar("exitReason", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PaperTrade = typeof paperTrades.$inferSelect;
export type InsertPaperTrade = typeof paperTrades.$inferInsert;

// Portfolios
export const portfolios = mysqlTable("portfolios", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").unique().notNull().references(() => users.id, { onDelete: "cascade" }),
  initialBalance: decimal("initialBalance", { precision: 15, scale: 2 }).default("10000.00"),
  currentBalance: decimal("currentBalance", { precision: 15, scale: 2 }),
  totalReturn: decimal("totalReturn", { precision: 10, scale: 2 }),
  totalTrades: int("totalTrades").default(0),
  winningTrades: int("winningTrades").default(0),
  winRate: decimal("winRate", { precision: 5, scale: 2 }),
  openPositions: json("openPositions"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = typeof portfolios.$inferInsert;

// Assets (B3)
export const assets = mysqlTable("assets", {
  id: int("id").autoincrement().primaryKey(),
  symbol: varchar("symbol", { length: 10 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  sector: varchar("sector", { length: 100 }),
  lastUpdated: timestamp("lastUpdated"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = typeof assets.$inferInsert;

// Asset Prices (Time Series)
export const assetPrices = mysqlTable("assetPrices", {
  id: int("id").autoincrement().primaryKey(),
  time: timestamp("time").notNull(),
  assetId: int("assetId").notNull().references(() => assets.id, { onDelete: "cascade" }),
  open: decimal("open", { precision: 10, scale: 4 }).notNull(),
  high: decimal("high", { precision: 10, scale: 4 }).notNull(),
  low: decimal("low", { precision: 10, scale: 4 }).notNull(),
  close: decimal("close", { precision: 10, scale: 4 }).notNull(),
  volume: bigint("volume", { mode: "bigint" }).notNull(),
});

export type AssetPrice = typeof assetPrices.$inferSelect;
export type InsertAssetPrice = typeof assetPrices.$inferInsert;

// Transactions
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("BRL"),
  type: mysqlEnum("type", ["subscription", "refund", "credit"]).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

// Watchlist
export const watchlist = mysqlTable("watchlist", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  assetId: int("assetId").notNull().references(() => assets.id, { onDelete: "cascade" }),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
  notes: text("notes"),
});

export type Watchlist = typeof watchlist.$inferSelect;
export type InsertWatchlist = typeof watchlist.$inferInsert;

// Notifications/Alerts
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", ["execution", "risk", "market", "system"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  severity: mysqlEnum("severity", ["info", "warning", "error", "success"]).default("info"),
  strategyId: int("strategyId").references(() => strategies.id, { onDelete: "set null" }),
  read: boolean("read").default(false),
  actionUrl: varchar("actionUrl", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// Audit Logs
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 255 }).notNull(),
  resourceType: varchar("resourceType", { length: 50 }),
  resourceId: int("resourceId"),
  details: json("details"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// Two-Factor Authentication
export const twoFactorAuth = mysqlTable("twoFactorAuth", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  secret: varchar("secret", { length: 255 }).notNull(),
  backupCodes: json("backupCodes"), // Array of hashed backup codes
  enabled: boolean("enabled").default(false),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TwoFactorAuth = typeof twoFactorAuth.$inferSelect;
export type InsertTwoFactorAuth = typeof twoFactorAuth.$inferInsert;

// User Sessions
export const userSessions = mysqlTable("userSessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionToken: varchar("sessionToken", { length: 255 }).notNull().unique(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: varchar("userAgent", { length: 500 }),
  lastActivityAt: timestamp("lastActivityAt").defaultNow(),
  expiresAt: timestamp("expiresAt"),
  revokedAt: timestamp("revokedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;

// Security Events (Login attempts, suspicious activity)
export const securityEvents = mysqlTable("securityEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "set null" }),
  eventType: mysqlEnum("eventType", ["login_success", "login_failed", "login_2fa", "suspicious_activity", "password_changed", "2fa_enabled", "2fa_disabled", "session_revoked"]).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("low"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: varchar("userAgent", { length: 500 }),
  details: json("details"),
  acknowledged: boolean("acknowledged").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SecurityEvent = typeof securityEvents.$inferSelect;
export type InsertSecurityEvent = typeof securityEvents.$inferInsert;