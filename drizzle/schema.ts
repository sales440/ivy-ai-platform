import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ROPA (Meta-Agent) Tables
export * from './ropa-schema';

// Client leads for sales campaigns
export const clientLeads = mysqlTable("client_leads", {
  id: int("id").autoincrement().primaryKey(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  contactName: varchar("contact_name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  industry: varchar("industry", { length: 100 }),
  companySize: varchar("company_size", { length: 50 }),
  status: mysqlEnum("status", ["new", "contacted", "qualified", "proposal", "closed_won", "closed_lost"]).default("new").notNull(),
  source: varchar("source", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ClientLead = typeof clientLeads.$inferSelect;
export type InsertClientLead = typeof clientLeads.$inferInsert;

// Sales campaigns managed by ROPA
export const salesCampaigns = mysqlTable("sales_campaigns", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["email", "phone", "social_media", "multi_channel"]).notNull(),
  status: mysqlEnum("status", ["draft", "active", "paused", "completed"]).default("draft").notNull(),
  targetAudience: text("target_audience"),
  content: text("content"),
  socialPlatform: varchar("social_platform", { length: 50 }),
  metrics: text("metrics"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdBy: varchar("created_by", { length: 64 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type SalesCampaign = typeof salesCampaigns.$inferSelect;
export type InsertSalesCampaign = typeof salesCampaigns.$inferInsert;

// Uploaded files
export const uploadedFiles = mysqlTable("uploaded_files", {
  id: int("id").autoincrement().primaryKey(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(),
  fileSize: int("file_size").notNull(),
  s3Key: varchar("s3_key", { length: 500 }).notNull(),
  s3Url: varchar("s3_url", { length: 500 }).notNull(),
  uploadedBy: varchar("uploaded_by", { length: 64 }).notNull(),
  processedLeads: int("processed_leads").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type UploadedFile = typeof uploadedFiles.$inferSelect;
export type InsertUploadedFile = typeof uploadedFiles.$inferInsert;

// Campaign content for validation before sending
export const campaignContent = mysqlTable("campaign_content", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaign_id"),
  companyId: int("company_id"),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  companyLogo: varchar("company_logo", { length: 500 }),
  companyAddress: text("company_address"),
  companyPhone: varchar("company_phone", { length: 50 }),
  companyEmail: varchar("company_email", { length: 320 }),
  companyWebsite: varchar("company_website", { length: 255 }),
  contentType: mysqlEnum("content_type", ["email", "call_script", "sms"]).notNull(),
  subject: varchar("subject", { length: 500 }),
  body: text("body").notNull(),
  htmlContent: text("html_content"),
  targetRecipients: text("target_recipients"),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "sent"]).default("pending").notNull(),
  rejectionReason: text("rejection_reason"),
  approvedBy: varchar("approved_by", { length: 64 }),
  approvedAt: timestamp("approved_at"),
  sentAt: timestamp("sent_at"),
  sentCount: int("sent_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type CampaignContent = typeof campaignContent.$inferSelect;
export type InsertCampaignContent = typeof campaignContent.$inferInsert;

// Company files (logos, email examples, branding assets)
export const companyFiles = mysqlTable("company_files", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("company_id"),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: mysqlEnum("file_type", ["logo", "email_example", "branding", "document", "client_list", "other"]).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  fileSize: int("file_size").notNull(),
  s3Key: varchar("s3_key", { length: 500 }).notNull(),
  s3Url: varchar("s3_url", { length: 500 }).notNull(),
  description: text("description"),
  uploadedBy: varchar("uploaded_by", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CompanyFile = typeof companyFiles.$inferSelect;
export type InsertCompanyFile = typeof companyFiles.$inferInsert;

// Imported client lists from Excel/CSV/PDF
export const clientLists = mysqlTable("client_lists", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("company_id"),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  listName: varchar("list_name", { length: 255 }).notNull(),
  sourceFileId: int("source_file_id"),
  sourceFileName: varchar("source_file_name", { length: 255 }),
  totalRecords: int("total_records").default(0),
  processedRecords: int("processed_records").default(0),
  status: mysqlEnum("status", ["pending", "processing", "completed", "error"]).default("pending").notNull(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ClientList = typeof clientLists.$inferSelect;
export type InsertClientList = typeof clientLists.$inferInsert;

// Individual client records from imported lists
export const clientRecords = mysqlTable("client_records", {
  id: int("id").autoincrement().primaryKey(),
  listId: int("list_id").notNull(),
  companyId: int("company_id"),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 255 }),
  position: varchar("position", { length: 255 }),
  industry: varchar("industry", { length: 100 }),
  location: varchar("location", { length: 255 }),
  customFields: text("custom_fields"),
  status: mysqlEnum("status", ["active", "contacted", "responded", "converted", "unsubscribed"]).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ClientRecord = typeof clientRecords.$inferSelect;
export type InsertClientRecord = typeof clientRecords.$inferInsert;

// TODO: Add your tables here