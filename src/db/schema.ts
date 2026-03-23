import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Core entity tables
// ---------------------------------------------------------------------------

export const initiatives = pgTable("initiatives", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  deadline: text("deadline").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  initiativeId: text("initiative_id").references(() => initiatives.id, {
    onDelete: "set null",
  }),
  deadline: text("deadline").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  details: text("details").notNull().default(""),
  completed: boolean("completed").notNull().default(false),
  projectId: text("project_id").references(() => projects.id, {
    onDelete: "set null",
  }),
  deadline: text("deadline").notNull().default(""),
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: text("completed_at").notNull().default(""),
  remindOn: text("remind_on").notNull().default(""),
  dueBy: text("due_by").notNull().default(""),
});

// ---------------------------------------------------------------------------
// Agent thread tables
// ---------------------------------------------------------------------------

export const agentThreads = pgTable("agent_threads", {
  id: text("id").primaryKey(),
  ownerType: text("owner_type").notNull(),
  ownerId: text("owner_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const agentThreadMessages = pgTable("agent_thread_messages", {
  id: text("id").primaryKey(),
  threadId: text("thread_id")
    .references(() => agentThreads.id, { onDelete: "cascade" })
    .notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  providerId: text("provider_id"),
  model: text("model"),
  status: text("status"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Legacy agent calls table (kept for migration reference)
// ---------------------------------------------------------------------------

export const agentCalls = pgTable("agent_calls", {
  id: text("id").primaryKey(),
  taskId: text("task_id")
    .references(() => tasks.id, { onDelete: "cascade" })
    .notNull(),
  providerId: text("provider_id").notNull(),
  model: text("model").notNull(),
  brief: text("brief").notNull(),
  status: text("status").notNull(),
  result: text("result"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Type exports for use in application code
// ---------------------------------------------------------------------------

export type DbInitiative = typeof initiatives.$inferSelect;
export type NewDbInitiative = typeof initiatives.$inferInsert;

export type DbProject = typeof projects.$inferSelect;
export type NewDbProject = typeof projects.$inferInsert;

export type DbTask = typeof tasks.$inferSelect;
export type NewDbTask = typeof tasks.$inferInsert;

export type DbAgentThread = typeof agentThreads.$inferSelect;
export type NewDbAgentThread = typeof agentThreads.$inferInsert;

export type DbAgentThreadMessage = typeof agentThreadMessages.$inferSelect;
export type NewDbAgentThreadMessage = typeof agentThreadMessages.$inferInsert;

export type DbAgentCall = typeof agentCalls.$inferSelect;
export type NewDbAgentCall = typeof agentCalls.$inferInsert;
