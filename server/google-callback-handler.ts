import { Request, Response } from "express";
import { getTokensFromCode, getOAuth2Client, setCredentials, initializeFolderStructure } from "./google-drive";
import { getDb } from "./db";
import { sql } from "drizzle-orm";

/**
 * Handle Google OAuth callback
 * This route receives the authorization code from Google and exchanges it for tokens
 * 
 * FIXED: Using raw SQL to avoid Drizzle ORM column mapping issues
 */
export async function handleGoogleCallback(req: Request, res: Response) {
  const { code, error } = req.query;

  // Handle authorization errors
  if (error) {
    console.error("[Google OAuth] Authorization error:", error);
    return res.redirect(`/?error=google_auth_failed&message=${encodeURIComponent(String(error))}`);
  }

  // Validate authorization code
  if (!code || typeof code !== "string") {
    console.error("[Google OAuth] No authorization code received");
    return res.redirect("/?error=google_auth_failed&message=No+authorization+code");
  }

  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Exchange code for tokens
    console.log("[Google OAuth] Exchanging authorization code for tokens...");
    const tokens = await getTokensFromCode(code);
    
    console.log("[Google OAuth] Tokens received:", {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiryDate: tokens.expiry_date,
      scope: tokens.scope
    });

    // Initialize folder structure
    console.log("[Google OAuth] Initializing Google Drive folder structure...");
    const oauth2Client = getOAuth2Client();
    setCredentials(oauth2Client, tokens);
    
    let folderIds = {};
    try {
      folderIds = await initializeFolderStructure(oauth2Client);
      console.log("[Google OAuth] Folder structure initialized:", folderIds);
    } catch (folderError) {
      console.warn("[Google OAuth] Could not initialize folders, continuing anyway:", folderError);
    }

    // Prepare token data - using raw SQL to avoid column mapping issues
    const accessToken = tokens.access_token || '';
    const refreshToken = tokens.refresh_token || null;
    const expiryDate = tokens.expiry_date ? new Date(tokens.expiry_date) : null;
    const scope = tokens.scope || null;
    const tokenType = tokens.token_type || 'Bearer';
    const folderIdsJson = JSON.stringify(folderIds);

    // Delete existing tokens using raw SQL
    console.log("[Google OAuth] Deleting existing tokens...");
    await db.execute(sql`DELETE FROM google_drive_tokens`);

    // Insert new tokens using raw SQL with explicit column names
    console.log("[Google OAuth] Inserting new tokens with raw SQL...");
    await db.execute(sql`
      INSERT INTO google_drive_tokens 
        (user_id, access_token, refresh_token, expiry_date, scope, token_type, folder_ids, created_at, updated_at)
      VALUES 
        (1, ${accessToken}, ${refreshToken}, ${expiryDate}, ${scope}, ${tokenType}, ${folderIdsJson}, NOW(), NOW())
    `);

    console.log("[Google OAuth] Authorization successful, tokens saved to database");

    // Verify the insert worked
    const verifyResult = await db.execute(sql`SELECT id, user_id, LEFT(access_token, 20) as token_preview FROM google_drive_tokens LIMIT 1`);
    console.log("[Google OAuth] Verification result:", verifyResult);

    // Redirect to success page
    res.redirect("/?google_drive_connected=true");
  } catch (error) {
    console.error("[Google OAuth] Error during callback:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.redirect(`/?error=google_auth_failed&message=${encodeURIComponent(errorMessage)}`);
  }
}
