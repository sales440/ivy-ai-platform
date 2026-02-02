import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, emailDrafts, InsertEmailDraft, EmailDraft } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
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

// TODO: add feature queries here as your schema grows.
