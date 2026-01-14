import { Request, Response } from "express";
import { getTokensFromCode, getOAuth2Client, setCredentials, initializeFolderStructure } from "./google-drive";
import { getDb } from "./db";
import { googleDriveTokens } from "../drizzle/schema";

/**
 * Handle Google OAuth callback
 * This route receives the authorization code from Google and exchanges it for tokens
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

    // Initialize folder structure
    console.log("[Google OAuth] Initializing Google Drive folder structure...");
    const oauth2Client = getOAuth2Client();
    setCredentials(oauth2Client, tokens);
    const folderIds = await initializeFolderStructure(oauth2Client);

    // Save tokens to database
    const tokenData = {
      userId: 1, // Default to admin user for Google Drive integration
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token || null,
      expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      scope: tokens.scope || null,
      tokenType: tokens.token_type || null,
      folderIds: JSON.stringify(folderIds),
    };

    // Delete existing tokens and insert new ones
    await db.delete(googleDriveTokens);
    await db.insert(googleDriveTokens).values(tokenData);

    console.log("[Google OAuth] Authorization successful, tokens saved");

    // Redirect to success page
    res.redirect("/?google_drive_connected=true");
  } catch (error) {
    console.error("[Google OAuth] Error during callback:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.redirect(`/?error=google_auth_failed&message=${encodeURIComponent(errorMessage)}`);
  }
}
