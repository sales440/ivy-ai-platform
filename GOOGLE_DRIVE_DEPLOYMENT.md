# Google Drive Integration - Deployment Guide

**Ivy.AI Platform - Centralized Storage System**

**Author:** Manus AI  
**Date:** January 13, 2026  
**Version:** 1.0

---

## Overview

This document provides comprehensive instructions for deploying the Google Drive integration to production on Railway. The integration enables automatic synchronization of databases, reports, templates, and campaign files to the Google Drive account **sales@ivybai.com**.

## Architecture

The Google Drive integration consists of the following components:

| Component | File | Purpose |
|-----------|------|---------|
| **OAuth Module** | `server/google-drive.ts` | Handles OAuth 2.0 authentication and file operations |
| **Database Schema** | `drizzle/schema.ts` | Stores OAuth tokens and folder IDs |
| **tRPC Router** | `server/google-drive-router.ts` | Exposes API endpoints for frontend |
| **OAuth Callback** | `server/google-callback-handler.ts` | Processes OAuth authorization codes |
| **Sync Service** | `server/google-drive-sync.ts` | Automatic file synchronization functions |
| **Backup Scheduler** | `server/backup-scheduler.ts` | Daily database backup automation |
| **Frontend UI** | `client/src/pages/GoogleDriveSettings.tsx` | User interface for management |

## Google Drive Folder Structure

The integration automatically creates the following folder hierarchy in Google Drive:

```
Ivy.AI - FAGOR/
├── Databases/
│   ├── Backups/          (Daily automatic backups)
│   └── Exports/          (Manual data exports)
├── Reportes/
│   ├── Daily/            (ROPA daily reports)
│   ├── Weekly/           (ROPA weekly reports)
│   └── Monthly/          (ROPA monthly reports)
├── Templates/
│   ├── Email Templates/  (Email campaign templates)
│   ├── Call Scripts/     (Phone call scripts)
│   └── SMS Templates/    (SMS campaign templates)
├── Campañas/             (Campaign-specific reports)
├── Logos & Branding/     (Company branding files)
└── Client Lists/         (Client databases and lists)
```

## Prerequisites

Before deploying to Railway, ensure you have:

1. **Google Cloud Project** created with Drive API enabled
2. **OAuth 2.0 Credentials** for sales@ivybai.com
3. **Railway Account** with project access
4. **GitHub Repository** connected to Railway
5. **Database** (MySQL/TiDB) provisioned on Railway

## OAuth Credentials

The following OAuth 2.0 credentials are already configured for the Ivy.AI platform:

| Parameter | Value |
|-----------|-------|
| **Client ID** | `845210461598-10r61sdcqdv54rbr6rh08qb58hqdso4.apps.googleusercontent.com` |
| **Client Secret** | `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` |
| **Authorized Redirect URIs** | `https://upbeat-creativity-production-27ac.up.railway.app/api/google/callback` |
|  | `http://localhost:3000/api/google/callback` |
| **Scopes** | `https://www.googleapis.com/auth/drive.file` |
|  | `https://www.googleapis.com/auth/drive.appdata` |

## Railway Environment Variables

No additional environment variables are required. The OAuth credentials are hardcoded in `server/google-drive.ts` for the production environment. The system automatically detects the environment and uses the correct redirect URI.

**Production Redirect URI:** `https://upbeat-creativity-production-27ac.up.railway.app/api/google/callback`

**Development Redirect URI:** `http://localhost:3000/api/google/callback`

## Deployment Steps

### Step 1: Commit and Push Changes

The Google Drive integration code is already committed to the repository. To deploy:

```bash
cd /home/ubuntu/ivy-ai-platform
git add .
git commit -m "Add Google Drive integration with automatic backups"
git push origin main
```

### Step 2: Railway Auto-Deployment

Railway is configured for automatic deployment from GitHub. Once you push to the `main` branch:

1. Railway detects the new commit
2. Builds the application automatically
3. Deploys to production
4. Restarts the server with new code

**No manual deployment steps are required.**

### Step 3: Verify Deployment

After deployment completes (typically 2-3 minutes):

1. Visit: `https://upbeat-creativity-production-27ac.up.railway.app/google-drive`
2. Check that the page loads without errors
3. Verify connection status shows "Desconectado"

### Step 4: Connect Google Drive

To authorize the application:

1. Navigate to `/google-drive` in production
2. Click **"Conectar Google Drive"**
3. Sign in with **sales@ivybai.com**
4. Grant permissions for Drive access
5. System will redirect back with success message
6. Verify connection status shows **"Conectado"**

### Step 5: Verify Folder Structure

After successful connection:

1. Open Google Drive as sales@ivybai.com
2. Verify folder **"Ivy.AI - FAGOR"** exists
3. Check that all subfolders are created correctly
4. Folder IDs are stored in database automatically

### Step 6: Test Manual Backup

To verify backup functionality:

1. Go to `/google-drive` page
2. Click **"Crear Backup Manual"**
3. Wait for success toast notification
4. Check Google Drive → `Ivy.AI - FAGOR/Databases/Backups/`
5. Verify backup file was created with timestamp

### Step 7: Verify Automatic Backups

The backup scheduler runs automatically:

- **Schedule:** Daily at 2:00 AM (server time)
- **First backup:** Scheduled on server startup
- **Logs:** Check ROPA logs for backup confirmations

To verify scheduler is running:

1. Check Railway logs for: `[Backup Scheduler] ✅ Automatic backups enabled`
2. Check for: `[Backup Scheduler] Next backup scheduled for: [DATE]`

## API Endpoints

The following tRPC endpoints are available:

| Endpoint | Type | Description |
|----------|------|-------------|
| `googleDrive.getAuthUrl` | Query | Get OAuth authorization URL |
| `googleDrive.authorize` | Mutation | Exchange code for tokens |
| `googleDrive.isConnected` | Query | Check connection status |
| `googleDrive.getFolderIds` | Query | Get folder IDs |
| `googleDrive.uploadFile` | Mutation | Upload file to Drive |
| `googleDrive.listFiles` | Mutation | List files in folder |
| `googleDrive.deleteFile` | Mutation | Delete file from Drive |
| `googleDrive.disconnect` | Mutation | Disconnect Drive |
| `googleDrive.triggerBackup` | Mutation | Trigger manual backup |

## ROPA Integration

The Google Drive sync is automatically integrated with ROPA:

### Automatic Report Syncing

When ROPA generates reports, they are automatically uploaded to Google Drive:

```typescript
// Daily reports → Reportes/Daily/
// Weekly reports → Reportes/Weekly/
// Monthly reports → Reportes/Monthly/
// Campaign reports → Campañas/
```

### Automatic Database Backups

Database backups are created and synced automatically:

```typescript
// Scheduled: Daily at 2:00 AM
// Location: Databases/Backups/
// Format: DB_Backup_full_YYYY-MM-DD-HH-MM-SS.sql
```

### Manual Operations

ROPA tools can trigger manual operations:

- `databaseTools.backupDatabase()` - Creates backup and syncs to Drive
- `advancedFeaturesTools.generate_nl_report()` - Generates report and syncs to Drive

## Monitoring and Logs

### Server Logs

Monitor Google Drive operations in Railway logs:

```
[Google Drive] Authorization successful, tokens saved
[Google Drive] File uploaded: Reporte_Diario_2026-01-13.txt
[Google Drive Sync] Daily report uploaded: Reporte_Diario_2026-01-13.txt
[Backup Scheduler] Backup synced to Google Drive: [LINK]
```

### ROPA Logs

Check ROPA logs table for detailed operation history:

```sql
SELECT * FROM ropa_logs 
WHERE message LIKE '%Google Drive%' 
ORDER BY timestamp DESC;
```

### Error Handling

The system includes robust error handling:

- **Token expiration:** Automatically refreshes tokens
- **Network errors:** Logs error and continues operation
- **Permission errors:** Alerts user to reconnect
- **Upload failures:** Retries with exponential backoff

## Security Considerations

### OAuth Token Storage

- Tokens are stored encrypted in the database
- Refresh tokens enable long-term access
- Access tokens are automatically refreshed

### Access Control

- Only authenticated users can access Google Drive endpoints
- All operations require valid session
- Admin-only operations protected by role check

### Data Privacy

- Files are stored in dedicated Google Drive account
- No public sharing enabled by default
- Folder structure prevents unauthorized access

## Troubleshooting

### Connection Issues

**Problem:** "Google Drive no conectado" error

**Solution:**
1. Check OAuth credentials are correct
2. Verify redirect URI matches production URL
3. Re-authorize from `/google-drive` page

### Upload Failures

**Problem:** Files not appearing in Google Drive

**Solution:**
1. Check connection status
2. Verify folder IDs in database
3. Check Railway logs for error messages
4. Test with manual backup

### Scheduler Not Running

**Problem:** No automatic backups

**Solution:**
1. Check Railway logs for scheduler initialization
2. Verify server startup completed successfully
3. Check for error messages in logs
4. Manually trigger backup to test

### Token Expiration

**Problem:** "Invalid credentials" error

**Solution:**
1. Disconnect and reconnect Google Drive
2. System will obtain fresh tokens
3. Verify refresh token is stored

## Maintenance

### Regular Tasks

| Task | Frequency | Action |
|------|-----------|--------|
| **Monitor backups** | Daily | Check backup folder for new files |
| **Review logs** | Weekly | Check for errors or warnings |
| **Test manual backup** | Monthly | Verify backup functionality |
| **Clean old files** | Quarterly | Archive or delete old backups |

### Backup Retention

Recommended retention policy:

- **Daily backups:** Keep 30 days
- **Weekly backups:** Keep 12 weeks
- **Monthly backups:** Keep 12 months
- **Campaign reports:** Keep indefinitely

### Token Refresh

OAuth tokens are automatically refreshed. No manual intervention required unless:

- User revokes access from Google Account
- OAuth credentials are changed
- Redirect URI is modified

## Support and Contact

For issues or questions regarding the Google Drive integration:

- **Technical Support:** Check Railway logs and ROPA logs
- **OAuth Issues:** Verify credentials in Google Cloud Console
- **Feature Requests:** Document in project repository

## Changelog

### Version 1.0 (January 13, 2026)

- Initial implementation of Google Drive integration
- OAuth 2.0 authentication with sales@ivybai.com
- Automatic folder structure creation
- Daily backup scheduler (2:00 AM)
- ROPA report auto-sync
- Manual backup trigger
- File browser UI
- Complete error handling

---

**End of Deployment Guide**
