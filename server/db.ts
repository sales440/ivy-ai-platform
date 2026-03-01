import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, emailDrafts, InsertEmailDraft, EmailDraft, salesCampaigns } from "../drizzle/schema";
import { ENV } from './_core/env';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _db: any | null = null;
let _pool: mysql.Pool | null = null;

// Create a connection pool with auto-reconnect for reliability
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Create a pool instead of single connection to handle ECONNRESET
      _pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        // Auto-reconnect on connection loss
        maxIdle: 5,
        idleTimeout: 60000,
      });
      _db = drizzle(_pool);
      console.log('[Database] Connection pool created successfully');
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      _pool = null;
    }
  }
  
  // Test connection health and reconnect if needed
  if (_db && _pool) {
    try {
      await _pool.query('SELECT 1');
    } catch (error) {
      console.warn('[Database] Connection lost, reconnecting...', (error as any).message);
      try {
        _pool = mysql.createPool({
          uri: process.env.DATABASE_URL,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          enableKeepAlive: true,
          keepAliveInitialDelay: 10000,
          maxIdle: 5,
          idleTimeout: 60000,
        });
        _db = drizzle(_pool);
        console.log('[Database] Reconnected successfully');
      } catch (reconnectError) {
        console.error('[Database] Reconnection failed:', reconnectError);
        _db = null;
        _pool = null;
      }
    }
  }
  
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ EMAIL DRAFTS CRUD ============

export async function createEmailDraft(draft: Omit<InsertEmailDraft, 'id'>): Promise<EmailDraft | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create email draft: database not available");
    return null;
  }

  try {
    await db.insert(emailDrafts).values(draft);
    // Fetch the created draft
    const result = await db.select().from(emailDrafts).where(eq(emailDrafts.draftId, draft.draftId)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to create email draft:", error);
    throw error;
  }
}

export async function getEmailDrafts(limit: number = 100): Promise<EmailDraft[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get email drafts: database not available");
    return [];
  }

  try {
    const result = await db.select().from(emailDrafts).orderBy(desc(emailDrafts.createdAt)).limit(limit);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get email drafts:", error);
    return [];
  }
}

export async function getEmailDraftById(draftId: string): Promise<EmailDraft | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get email draft: database not available");
    return null;
  }

  try {
    const result = await db.select().from(emailDrafts).where(eq(emailDrafts.draftId, draftId)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get email draft:", error);
    return null;
  }
}

export async function updateEmailDraftStatus(
  draftId: string,
  status: 'pending' | 'approved' | 'rejected' | 'sent',
  approvedBy?: string,
  rejectionReason?: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update email draft: database not available");
    return false;
  }

  try {
    const updateData: Partial<EmailDraft> = { status };
    
    if (status === 'approved' && approvedBy) {
      updateData.approvedBy = approvedBy;
      updateData.approvedAt = new Date();
    }
    
    if (status === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }
    
    if (status === 'sent') {
      updateData.sentAt = new Date();
    }

    await db.update(emailDrafts).set(updateData).where(eq(emailDrafts.draftId, draftId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update email draft:", error);
    return false;
  }
}

export async function updateEmailDraftContent(
  draftId: string,
  subject: string,
  body: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update email draft content: database not available");
    return false;
  }

  try {
    await db.update(emailDrafts).set({
      subject,
      body,
    }).where(eq(emailDrafts.draftId, draftId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update email draft content:", error);
    return false;
  }
}

export async function deleteEmailDraft(draftId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete email draft: database not available");
    return false;
  }

  try {
    await db.delete(emailDrafts).where(eq(emailDrafts.draftId, draftId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete email draft:", error);
    return false;
  }
}

/**
 * Get all approved email drafts (ready to send)
 */
export async function getApprovedEmailDrafts(): Promise<EmailDraft[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get approved email drafts: database not available");
    return [];
  }

  try {
    const result = await db.select().from(emailDrafts)
      .where(eq(emailDrafts.status, 'approved'))
      .orderBy(desc(emailDrafts.approvedAt));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get approved email drafts:", error);
    return [];
  }
}

/**
 * Mark multiple drafts as sent
 */
export async function markDraftsAsSent(draftIds: string[]): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot mark drafts as sent: database not available");
    return false;
  }

  try {
    for (const draftId of draftIds) {
      await db.update(emailDrafts).set({
        status: 'sent',
        sentAt: new Date(),
      }).where(eq(emailDrafts.draftId, draftId));
    }
    return true;
  } catch (error) {
    console.error("[Database] Failed to mark drafts as sent:", error);
    return false;
  }
}

/**
 * Create a campaign in the DB from approved email drafts
 */
export async function createCampaignFromApprovedDraft(params: {
  name: string;
  company: string;
  type: 'email' | 'phone' | 'social_media' | 'multi_channel';
  draftCount: number;
}): Promise<number | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create campaign: database not available");
    return null;
  }

  try {
    const [result] = await db.insert(salesCampaigns).values({
      name: params.name,
      type: params.type,
      status: 'active',
      targetAudience: `${params.company} - ${params.draftCount} emails aprobados`,
      content: `Campaña creada automáticamente desde ${params.draftCount} emails aprobados en Monitor`,
      metrics: JSON.stringify({
        pendingEmails: params.draftCount,
        sentEmails: 0,
        openRate: 0,
        clickRate: 0,
        conversions: 0,
      }),
      createdBy: 'ROPA',
    });
    return result.insertId;
  } catch (error) {
    console.error("[Database] Failed to create campaign from draft:", error);
    return null;
  }
}

// TODO: add feature queries here as your schema grows.
