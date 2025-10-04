import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const companies = sqliteTable('companies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  defaultCurrency: text('default_currency').notNull().default('USD'),
  createdAt: text('created_at').notNull(),
});

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  password: text('password').notNull(),
  role: text('role', { enum: ['admin', 'employee', 'manager', 'director', 'CFO', 'finance'] }).notNull(),
  companyId: integer('company_id').references(() => companies.id),
  managerId: integer('manager_id').references(() => users.id),
  createdAt: text('created_at').notNull(),
});

export const expenses = sqliteTable('expenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  employeeId: integer('employee_id').references(() => users.id),
  amount: real('amount').notNull(),
  originalCurrency: text('original_currency').notNull(),
  convertedAmount: real('converted_amount'),
  category: text('category').notNull(),
  description: text('description').notNull(),
  expenseDate: text('expense_date').notNull(),
  status: text('status').notNull().default('pending'),
  companyId: integer('company_id').references(() => companies.id),
  createdAt: text('created_at').notNull(),
});

export const approvalRules = sqliteTable('approval_rules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  companyId: integer('company_id').references(() => companies.id),
  ruleName: text('rule_name').notNull(),
  isManagerApprover: integer('is_manager_approver', { mode: 'boolean' }).default(true),
  approvalType: text('approval_type').notNull(),
  percentageRequired: integer('percentage_required'),
  specificApproverId: integer('specific_approver_id').references(() => users.id),
  createdAt: text('created_at').notNull(),
});

export const approvalRuleApprovers = sqliteTable('approval_rule_approvers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  approvalRuleId: integer('approval_rule_id').references(() => approvalRules.id),
  approverId: integer('approver_id').references(() => users.id),
  sequenceOrder: integer('sequence_order').notNull(),
  createdAt: text('created_at').notNull(),
});

export const expenseApprovals = sqliteTable('expense_approvals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  expenseId: integer('expense_id').references(() => expenses.id),
  approverId: integer('approver_id').references(() => users.id),
  sequenceOrder: integer('sequence_order').notNull(),
  status: text('status').notNull().default('pending'),
  comments: text('comments'),
  approvedAt: text('approved_at'),
  createdAt: text('created_at').notNull(),
});

// Define relations for Drizzle ORM queries
export const approvalRulesRelations = relations(approvalRules, ({ many, one }) => ({
  approvers: many(approvalRuleApprovers),
  company: one(companies, {
    fields: [approvalRules.companyId],
    references: [companies.id],
  }),
}));

export const approvalRuleApproversRelations = relations(approvalRuleApprovers, ({ one }) => ({
  rule: one(approvalRules, {
    fields: [approvalRuleApprovers.approvalRuleId],
    references: [approvalRules.id],
  }),
  user: one(users, {
    fields: [approvalRuleApprovers.approverId],
    references: [users.id],
  }),
}));

export const expenseApprovalsRelations = relations(expenseApprovals, ({ one }) => ({
  expense: one(expenses, {
    fields: [expenseApprovals.expenseId],
    references: [expenses.id],
  }),
  approver: one(users, {
    fields: [expenseApprovals.approverId],
    references: [users.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  employee: one(users, {
    fields: [expenses.employeeId],
    references: [users.id],
  }),
}));

// Auth tables for better-auth
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});