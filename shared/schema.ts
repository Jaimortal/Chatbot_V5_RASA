import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("admin"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const adminResponses = pgTable("admin_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  intent: text("intent").notNull().unique(),
  category: text("category").notNull(),
  subCategory: text("sub_category").default(""),
  responses: jsonb("responses").notNull(),
  metadata: jsonb("metadata").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const loginAttempts = pgTable("login_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  identifier: text("identifier").notNull(), // IP + username combination
  attemptCount: integer("attempt_count").default(1),
  lastAttempt: timestamp("last_attempt").defaultNow(),
  lockedUntil: timestamp("locked_until"), // null if not locked
  createdAt: timestamp("created_at").defaultNow(),
});

export const userSessions = pgTable("user_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull().unique(),
  token: text("token").notNull(),
  username: text("username").notNull(),
  expires: timestamp("expires").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const locations = pgTable("locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  coordinates: jsonb("coordinates").notNull(), // [y, x] format
  mapImage: text("map_image").default("/generated_map.png"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userPrivileges = pgTable("user_privileges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatEnabled: boolean("chat_enabled").default(true),
  audioInputEnabled: boolean("audio_input_enabled").default(true),
  mapAccessEnabled: boolean("map_access_enabled").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const conversationLogs = pgTable("conversation_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull(),
  userMessage: text("user_message").notNull(),
  botResponse: text("bot_response"),
  userMessageTimestamp: timestamp("user_message_timestamp").defaultNow(),
  botResponseTimestamp: timestamp("bot_response_timestamp"),
  intent: text("intent"),
  language: text("language").default("en"),
  responseTime: integer("response_time"), // Response time in milliseconds
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema definitions for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export const insertAdminResponseSchema = createInsertSchema(adminResponses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  createdAt: true,
});

export const insertUserPrivilegesSchema = createInsertSchema(userPrivileges).omit({
  id: true,
  updatedAt: true,
});

export const insertConversationLogSchema = createInsertSchema(conversationLogs).omit({
  id: true,
  createdAt: true,
});

// Type definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertAdminResponse = z.infer<typeof insertAdminResponseSchema>;
export type AdminResponse = typeof adminResponses.$inferSelect;

export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect;

export type InsertUserPrivileges = z.infer<typeof insertUserPrivilegesSchema>;
export type UserPrivileges = typeof userPrivileges.$inferSelect;

export type InsertConversationLog = z.infer<typeof insertConversationLogSchema>;
export type ConversationLog = typeof conversationLogs.$inferSelect;

export type LoginAttempt = typeof loginAttempts.$inferSelect;
export type UserSession = typeof userSessions.$inferSelect;
