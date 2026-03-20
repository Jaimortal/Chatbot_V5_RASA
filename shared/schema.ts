import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, jsonb, integer, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("admin"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Table for responses.json data
export const botResponses = pgTable("bot_responses", {
  id: serial("id").primaryKey(),
  intent: text("intent").notNull().unique(),
  category: text("category").default(""),
  subCategory: text("sub_category").default(""),
  // Answer can be multilingual or simple array
  answerEn: jsonb("answer_en").$type<string[]>().default([]),
  answerCeb: jsonb("answer_ceb").$type<string[]>().default([]),
  // Simple answer for non-multilingual responses
  answer: jsonb("answer").$type<string[]>().default([]),
  followUp: jsonb("follow_up").$type<string[]>().default([]),
  contextSlots: jsonb("context_slots").default({}),
  imageUrl: text("image_url").default(""),
  imageUrls: jsonb("image_urls").$type<string[]>().default([]),
  mapData: jsonb("map_data").default(null),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Table for responses_location.json data
export const locationResponses = pgTable("location_responses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  building: text("building").notNull(),
  floor: text("floor").default("N/A"),
  coordinates: jsonb("coordinates").$type<number[]>().notNull(), // [y, x] format
  mapId: text("map_id").default("main_map"),
  // Multilingual responses
  responsesEn: jsonb("responses_en").$type<string[]>().default([]),
  responsesCeb: jsonb("responses_ceb").$type<string[]>().default([]),
  // Additional map data
  pins: jsonb("pins").$type<{name: string, coordinates: number[]}[]>().default([]),
  imageUrls: jsonb("image_urls").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Keep existing admin_responses table for admin-managed responses
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

// Simplified locations table for basic location data
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
  autoTranslateEnabled: boolean("auto_translate_enabled").default(true),
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

export const insertBotResponseSchema = createInsertSchema(botResponses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLocationResponseSchema = createInsertSchema(locationResponses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

export type InsertBotResponse = z.infer<typeof insertBotResponseSchema>;
export type BotResponse = typeof botResponses.$inferSelect;

export type InsertLocationResponse = z.infer<typeof insertLocationResponseSchema>;
export type LocationResponse = typeof locationResponses.$inferSelect;

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
