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

// A/B Testing System for Campaign Optimization
export const abTests = mysqlTable("ab_tests", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaign_id"),
  testName: varchar("test_name", { length: 255 }).notNull(),
  testType: mysqlEnum("test_type", ["email_subject", "email_content", "call_script", "sms_content", "landing_page"]).notNull(),
  hypothesis: text("hypothesis"),
  status: mysqlEnum("status", ["draft", "running", "completed", "paused"]).default("draft").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  winnerVariantId: int("winner_variant_id"),
  confidenceLevel: int("confidence_level").default(95),
  significanceReached: int("significance_reached").default(0),
  createdBy: varchar("created_by", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ABTest = typeof abTests.$inferSelect;
export type InsertABTest = typeof abTests.$inferInsert;

// A/B Test Variants (Control + Variations)
export const abTestVariants = mysqlTable("ab_test_variants", {
  id: int("id").autoincrement().primaryKey(),
  testId: int("test_id").notNull(),
  variantName: varchar("variant_name", { length: 100 }).notNull(), // "Control", "Variant A", "Variant B"
  isControl: int("is_control").default(0),
  content: text("content").notNull(), // JSON with variant-specific content
  trafficPercentage: int("traffic_percentage").default(50), // % of traffic allocated
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ABTestVariant = typeof abTestVariants.$inferSelect;
export type InsertABTestVariant = typeof abTestVariants.$inferInsert;

// A/B Test Results (metrics per variant)
export const abTestResults = mysqlTable("ab_test_results", {
  id: int("id").autoincrement().primaryKey(),
  testId: int("test_id").notNull(),
  variantId: int("variant_id").notNull(),
  impressions: int("impressions").default(0), // Total sent/shown
  opens: int("opens").default(0), // Email opens
  clicks: int("clicks").default(0), // Link clicks
  conversions: int("conversions").default(0), // Desired action completed
  bounces: int("bounces").default(0), // Email bounces
  unsubscribes: int("unsubscribes").default(0),
  revenue: int("revenue").default(0), // Revenue generated (in cents)
  conversionRate: int("conversion_rate").default(0), // Stored as percentage * 100
  openRate: int("open_rate").default(0),
  clickRate: int("click_rate").default(0),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ABTestResult = typeof abTestResults.$inferSelect;
export type InsertABTestResult = typeof abTestResults.$inferInsert;

// TODO: Add your tables here
// Google Drive OAuth tokens
export const googleDriveTokens = mysqlTable("google_drive_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiryDate: timestamp("expiry_date"),
  scope: text("scope"),
  tokenType: varchar("token_type", { length: 50 }),
  folderIds: text("folder_ids"), // JSON string of folder IDs
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type GoogleDriveToken = typeof googleDriveTokens.$inferSelect;
export type InsertGoogleDriveToken = typeof googleDriveTokens.$inferInsert;


// Empresas/Clientes de Ivy.AI con ID único para Google Drive
export const ivyClients = mysqlTable("ivy_clients", {
  id: int("id").autoincrement().primaryKey(),
  clientId: varchar("client_id", { length: 32 }).notNull().unique(), // ID único auto-generado (ej: IVY-2026-0001)
  companyName: varchar("company_name", { length: 255 }).notNull(),
  industry: varchar("industry", { length: 100 }),
  contactName: varchar("contact_name", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 320 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  address: text("address"),
  website: varchar("website", { length: 255 }),
  logo: varchar("logo_url", { length: 500 }),
  // Google Drive Integration
  googleDriveFolderId: varchar("google_drive_folder_id", { length: 100 }), // ID de carpeta raíz en Google Drive
  googleDriveStructure: text("google_drive_structure"), // JSON con IDs de subcarpetas
  // Status
  status: mysqlEnum("status", ["active", "inactive", "prospect", "churned"]).default("prospect").notNull(),
  plan: mysqlEnum("plan", ["free", "starter", "professional", "enterprise"]).default("free").notNull(),
  // Metadata
  notes: text("notes"),
  createdBy: varchar("created_by", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type IvyClient = typeof ivyClients.$inferSelect;
export type InsertIvyClient = typeof ivyClients.$inferInsert;

// Relación de archivos por cliente
export const clientFiles = mysqlTable("client_files", {
  id: int("id").autoincrement().primaryKey(),
  clientId: varchar("client_id", { length: 32 }).notNull(), // Referencia a ivy_clients.client_id
  fileType: mysqlEnum("file_type", ["logo", "template", "report", "backup", "document", "campaign_asset", "client_list", "other"]).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  googleDriveFileId: varchar("google_drive_file_id", { length: 100 }),
  googleDriveUrl: varchar("google_drive_url", { length: 500 }),
  mimeType: varchar("mime_type", { length: 100 }),
  fileSize: int("file_size"),
  description: text("description"),
  uploadedBy: varchar("uploaded_by", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ClientFile = typeof clientFiles.$inferSelect;
export type InsertClientFile = typeof clientFiles.$inferInsert;

// Email Drafts for Monitor section - persistent storage
export const emailDrafts = mysqlTable("email_drafts", {
  id: int("id").autoincrement().primaryKey(),
  draftId: varchar("draft_id", { length: 64 }).notNull().unique(), // Unique ID for frontend reference
  company: varchar("company", { length: 255 }).notNull(),
  campaign: varchar("campaign", { length: 255 }),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  htmlContent: text("html_content"), // Optional HTML version
  recipientEmail: varchar("recipient_email", { length: 320 }),
  recipientName: varchar("recipient_name", { length: 255 }),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "sent"]).default("pending").notNull(),
  rejectionReason: text("rejection_reason"),
  approvedBy: varchar("approved_by", { length: 64 }),
  approvedAt: timestamp("approved_at"),
  sentAt: timestamp("sent_at"),
  createdBy: varchar("created_by", { length: 64 }), // ROPA or user who created it
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type EmailDraft = typeof emailDrafts.$inferSelect;
export type InsertEmailDraft = typeof emailDrafts.$inferInsert;
