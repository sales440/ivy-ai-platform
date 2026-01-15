import { Request, Response } from "express";
import { getTokensFromCode, getOAuth2Client, setCredentials, initializeFolderStructure } from "./google-drive";
import mysql from "mysql2/promise";

/**
 * Get raw MySQL connection - bypasses Drizzle ORM completely
 */
async function getRawConnection() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL not configured");
  }
  
  const url = new URL(databaseUrl);
  const config = {
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: false }
  };
  
  return mysql.createConnection(config);
}

/**
 * Ensure google_drive_tokens table exists
 */
async function ensureTableExists(connection: mysql.Connection) {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS google_drive_tokens (
      id int AUTO_INCREMENT PRIMARY KEY,
      user_id varchar(64) NOT NULL,
      access_token text NOT NULL,
      refresh_token text,
      expiry_date bigint,
      scope text,
      token_type varchar(64),
      folder_ids json,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user (user_id)
    )
  `;
  
  await connection.execute(createTableSQL);
  console.log("[Google OAuth] ✓ Table google_drive_tokens verified/created");
}

/**
 * Handle Google OAuth callback
 * This route receives the authorization code from Google and exchanges it for tokens
 */
export async function handleGoogleCallback(req: Request, res: Response) {
  console.log("[Google OAuth] ========== CALLBACK RECEIVED ==========");
  console.log("[Google OAuth] Query params:", JSON.stringify(req.query));
  
  const { code, error } = req.query;

  // Handle authorization errors
  if (error) {
    console.error("[Google OAuth] Authorization error:", error);
    return res.redirect(`/ropa-v2?error=google_auth_failed&message=${encodeURIComponent(String(error))}`);
  }

  // Validate authorization code
  if (!code || typeof code !== "string") {
    console.error("[Google OAuth] No authorization code received");
    return res.redirect("/ropa-v2?error=google_auth_failed&message=No+authorization+code");
  }
  
  console.log("[Google OAuth] Code received, length:", code.length);

  let connection: mysql.Connection | null = null;
  
  try {
    // Get raw MySQL connection
    console.log("[Google OAuth] Connecting to database...");
    connection = await getRawConnection();
    
    // Ensure table exists
    await ensureTableExists(connection);

    // Exchange code for tokens
    console.log("[Google OAuth] Exchanging authorization code for tokens...");
    const tokens = await getTokensFromCode(code);
    
    if (!tokens.access_token) {
      throw new Error("No access token received from Google");
    }

    // Initialize folder structure
    console.log("[Google OAuth] Initializing Google Drive folder structure...");
    const oauth2Client = getOAuth2Client();
    setCredentials(oauth2Client, tokens);
    
    let folderIds = {};
    try {
      folderIds = await initializeFolderStructure(oauth2Client);
      console.log("[Google OAuth] Folder structure created:", folderIds);
    } catch (folderError) {
      console.warn("[Google OAuth] Could not create folders, continuing:", folderError);
    }

    // Prepare token data
    const tokenData = {
      user_id: "owner",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      expiry_date: tokens.expiry_date || null,
      scope: tokens.scope || null,
      token_type: tokens.token_type || "Bearer",
      folder_ids: JSON.stringify(folderIds)
    };

    console.log("[Google OAuth] Saving tokens to database...");
    
    // Delete existing tokens
    await connection.execute("DELETE FROM google_drive_tokens WHERE user_id = ?", [tokenData.user_id]);
    
    // Insert new tokens
    await connection.execute(
      `INSERT INTO google_drive_tokens (user_id, access_token, refresh_token, expiry_date, scope, token_type, folder_ids, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        tokenData.user_id,
        tokenData.access_token,
        tokenData.refresh_token,
        tokenData.expiry_date,
        tokenData.scope,
        tokenData.token_type,
        tokenData.folder_ids
      ]
    );
    
    console.log("[Google OAuth] ✓ Tokens saved successfully");

    // Redirect to ROPA dashboard files section with success
    console.log("[Google OAuth] ✓ SUCCESS - Redirecting to /ropa-v2 with google_drive_connected=true");
    res.redirect("/ropa-v2?google_drive_connected=true");
    
  } catch (error) {
    console.error("[Google OAuth] Error during callback:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.redirect(`/ropa-v2?error=google_auth_failed&message=${encodeURIComponent(errorMessage)}`);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
