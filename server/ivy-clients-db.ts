/**
 * Centralized ivy_clients database operations using RAW SQL
 * 
 * REASON: Drizzle ORM queries against ivy_clients consistently fail in Railway production
 * with "Failed query" errors. This module uses raw SQL exclusively to bypass the issue.
 * All other files should import from here instead of using Drizzle ORM directly on ivyClients.
 */

import { sql } from "drizzle-orm";
import { getDb } from "./db";

export interface IvyClientRow {
  id: number;
  client_id: string;
  company_name: string;
  industry: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  website: string | null;
  logo_url: string | null;
  google_drive_folder_id: string | null;
  google_drive_structure: string | null;
  status: string;
  plan: string;
  notes: string | null;
  created_by: string | null;
  created_at: string | Date;
  updated_at: string | Date;
}

// Helper to normalize row keys from snake_case to camelCase for compatibility
export function normalizeToCamel(row: IvyClientRow): any {
  return {
    id: row.id,
    clientId: row.client_id,
    companyName: row.company_name,
    industry: row.industry,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    address: row.address,
    website: row.website,
    logo: row.logo_url,
    googleDriveFolderId: row.google_drive_folder_id,
    googleDriveStructure: row.google_drive_structure,
    status: row.status,
    plan: row.plan,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get all clients ordered by created_at DESC
 */
export async function getAllClients(): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const [rows] = await db.execute(sql`SELECT * FROM ivy_clients ORDER BY created_at DESC`);
    const results = Array.isArray(rows) ? rows : [];
    return results.map((r: any) => normalizeToCamel(r));
  } catch (err) {
    console.error("[IvyClientsDB] getAllClients failed:", (err as Error).message);
    return [];
  }
}

/**
 * Get a single client by client_id
 */
export async function getClientByClientId(clientId: string): Promise<any | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const [rows] = await db.execute(sql`SELECT * FROM ivy_clients WHERE client_id = ${clientId} LIMIT 1`);
    const results = Array.isArray(rows) ? rows : [];
    return results.length > 0 ? normalizeToCamel(results[0] as IvyClientRow) : null;
  } catch (err) {
    console.error("[IvyClientsDB] getClientByClientId failed:", (err as Error).message);
    return null;
  }
}

/**
 * Get a single client by company_name (case-insensitive)
 */
export async function getClientByName(companyName: string): Promise<any | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const [rows] = await db.execute(sql`SELECT * FROM ivy_clients WHERE LOWER(company_name) = LOWER(${companyName}) LIMIT 1`);
    const results = Array.isArray(rows) ? rows : [];
    return results.length > 0 ? normalizeToCamel(results[0] as IvyClientRow) : null;
  } catch (err) {
    console.error("[IvyClientsDB] getClientByName failed:", (err as Error).message);
    return null;
  }
}

/**
 * Insert a new client
 */
export async function insertClient(params: {
  clientId: string;
  companyName: string;
  industry?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  website?: string;
  logo?: string;
  googleDriveFolderId?: string;
  googleDriveStructure?: string;
  status?: string;
  plan?: string;
  notes?: string;
  createdBy?: string;
}): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    await db.execute(sql`
      INSERT INTO ivy_clients (client_id, company_name, industry, contact_name, contact_email, contact_phone, address, website, logo_url, google_drive_folder_id, google_drive_structure, status, \`plan\`, notes, created_by)
      VALUES (
        ${params.clientId},
        ${params.companyName},
        ${params.industry || null},
        ${params.contactName || null},
        ${params.contactEmail || null},
        ${params.contactPhone || null},
        ${params.address || null},
        ${params.website || null},
        ${params.logo || null},
        ${params.googleDriveFolderId || null},
        ${params.googleDriveStructure || null},
        ${params.status || 'prospect'},
        ${params.plan || 'free'},
        ${params.notes || null},
        ${params.createdBy || null}
      )
    `);
    return true;
  } catch (err) {
    console.error("[IvyClientsDB] insertClient failed:", (err as Error).message);
    return false;
  }
}

/**
 * Update a client by client_id
 */
export async function updateClient(clientId: string, updates: Record<string, any>): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const columnMap: Record<string, string> = {
    companyName: 'company_name',
    industry: 'industry',
    contactName: 'contact_name',
    contactEmail: 'contact_email',
    contactPhone: 'contact_phone',
    address: 'address',
    website: 'website',
    logo: 'logo_url',
    googleDriveFolderId: 'google_drive_folder_id',
    googleDriveStructure: 'google_drive_structure',
    status: 'status',
    plan: 'plan',
    notes: 'notes',
    createdBy: 'created_by',
    company_name: 'company_name',
    contact_name: 'contact_name',
    contact_email: 'contact_email',
    contact_phone: 'contact_phone',
    logo_url: 'logo_url',
    google_drive_folder_id: 'google_drive_folder_id',
    google_drive_structure: 'google_drive_structure',
    created_by: 'created_by',
  };

  try {
    // Update one field at a time using parameterized queries
    for (const [key, value] of Object.entries(updates)) {
      const col = columnMap[key];
      if (col) {
        await db.execute(sql`UPDATE ivy_clients SET ${sql.raw(`\`${col}\``)} = ${value} WHERE client_id = ${clientId}`);
      }
    }
    return true;
  } catch (err) {
    console.error("[IvyClientsDB] updateClient failed:", (err as Error).message);
    return false;
  }
}

/**
 * Update a single field on a client
 */
export async function updateClientField(clientId: string, field: string, value: any): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const columnMap: Record<string, string> = {
    companyName: 'company_name',
    industry: 'industry',
    contactName: 'contact_name',
    contactEmail: 'contact_email',
    contactPhone: 'contact_phone',
    address: 'address',
    website: 'website',
    logo: 'logo_url',
    googleDriveFolderId: 'google_drive_folder_id',
    googleDriveStructure: 'google_drive_structure',
    status: 'status',
    plan: 'plan',
    notes: 'notes',
    createdBy: 'created_by',
    company_name: 'company_name',
    contact_name: 'contact_name',
    contact_email: 'contact_email',
    contact_phone: 'contact_phone',
    logo_url: 'logo_url',
    google_drive_folder_id: 'google_drive_folder_id',
    google_drive_structure: 'google_drive_structure',
    created_by: 'created_by',
  };

  const col = columnMap[field];
  if (!col) return false;

  try {
    await db.execute(sql`UPDATE ivy_clients SET ${sql.raw(`\`${col}\``)} = ${value} WHERE client_id = ${clientId}`);
    return true;
  } catch (err) {
    console.error(`[IvyClientsDB] updateClientField(${field}) failed:`, (err as Error).message);
    return false;
  }
}

/**
 * Delete a client by client_id
 */
export async function deleteClient(clientId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    await db.execute(sql`DELETE FROM ivy_clients WHERE client_id = ${clientId}`);
    return true;
  } catch (err) {
    console.error("[IvyClientsDB] deleteClient failed:", (err as Error).message);
    return false;
  }
}

/**
 * Count total clients
 */
export async function countClients(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  try {
    const [rows] = await db.execute(sql`SELECT COUNT(*) as cnt FROM ivy_clients`);
    const results = Array.isArray(rows) ? rows : [];
    return results.length > 0 ? Number((results[0] as any).cnt || 0) : 0;
  } catch (err) {
    console.error("[IvyClientsDB] countClients failed:", (err as Error).message);
    return 0;
  }
}

/**
 * Search clients by name (partial match)
 */
export async function searchClientsByName(query: string): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const [rows] = await db.execute(sql`SELECT * FROM ivy_clients WHERE company_name LIKE ${`%${query}%`} ORDER BY created_at DESC`);
    const results = Array.isArray(rows) ? rows : [];
    return results.map((r: any) => normalizeToCamel(r));
  } catch (err) {
    console.error("[IvyClientsDB] searchClientsByName failed:", (err as Error).message);
    return [];
  }
}

/**
 * Get client count for generating next client ID
 */
export async function getNextClientId(): Promise<string> {
  const count = await countClients();
  const year = new Date().getFullYear();
  const nextNum = count + 1;
  return `IVY-${year}-${String(nextNum).padStart(4, '0')}`;
}
