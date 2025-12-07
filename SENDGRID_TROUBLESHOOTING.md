# SendGrid "Unauthorized" Error - Troubleshooting Guide

## 🔍 Problem Identified

**Error:** `401 Unauthorized - The provided authorization grant is invalid, expired, or revoked`

**Root Cause:** The SendGrid API key configured in `SENDGRID_API_KEY` environment variable is either:
- Expired
- Revoked
- Invalid
- Missing required permissions

**Impact:** FAGOR drip campaign emails are not being sent (46 pending emails as of Nov 30, 2025)

---

## ✅ Diagnostic Results

### Test Performed:
```bash
node test-sendgrid.mjs
```

### Output:
```
❌ Email send failed:
   Error Code: 401
   Status Code: undefined
   Message: Unauthorized
   Response Body: {
     "errors": [
       {
         "message": "The provided authorization grant is invalid, expired, or revoked",
         "field": null,
         "help": null
       }
     ]
   }
```

### Current Configuration:
- **API Key Set:** ✅ YES
- **Key Length:** 69 characters
- **Key Format:** `SG.pGemDkn...hFtVw`
- **Key Status:** ❌ INVALID/EXPIRED

---

## 🔧 Solution: Generate New SendGrid API Key

### Step 1: Create New API Key in SendGrid

1. **Login to SendGrid:**
   - Go to: https://app.sendgrid.com/login

2. **Navigate to API Keys:**
   - https://app.sendgrid.com/settings/api_keys

3. **Create New API Key:**
   - Click **"Create API Key"** button
   - **Name:** `Ivy AI Platform - FAGOR Campaigns`
   - **API Key Permissions:** Select one of:
     - **Full Access** (recommended for testing)
     - **Restricted Access** → Enable only **"Mail Send"** permission
   
4. **Copy the API Key:**
   - ⚠️ **IMPORTANT:** The key is only shown once!
   - Copy it immediately and save it securely
   - Format: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 2: Verify Sender Email

Before emails can be sent, the sender email must be verified:

1. **Navigate to Sender Authentication:**
   - https://app.sendgrid.com/settings/sender_auth

2. **Check if `service@fagor-automation.com` is verified:**
   - Look for it in the "Single Sender Verification" list
   - Status should be **"Verified"**

3. **If NOT verified:**
   - Click **"Create New Sender"**
   - Fill in:
     - **From Name:** FAGOR Automation Corp.
     - **From Email Address:** service@fagor-automation.com
     - **Reply To:** (same or different email)
     - **Company Address:** (required by SendGrid)
   - Click **"Create"**
   - Check email inbox for verification link
   - Click the verification link

### Step 3: Update Railway Environment Variable

1. **Login to Railway:**
   - https://railway.app/

2. **Select Project:**
   - Navigate to "ivy-ai-platform-production"

3. **Update Environment Variable:**
   - Go to **Settings** → **Variables**
   - Find `SENDGRID_API_KEY`
   - Click **Edit**
   - Paste the new API key
   - Click **Save**

4. **Redeploy:**
   - Railway will automatically redeploy with the new key
   - Wait 3-5 minutes for deployment to complete

### Step 4: Verify Fix

1. **Check Railway Logs:**
   - Look for: `[FAGOR Drip] ✅ Sent Email 1 to xxx@xxx.com`
   - Should NOT see: `❌ Failed to send Email 1 to xxx@xxx.com: Unauthorized`

2. **Test Locally (Optional):**
   ```bash
   export SENDGRID_API_KEY="SG.your_new_key_here"
   node test-sendgrid.mjs
   ```
   - Should see: `✅ Email sent successfully!` (or 403 if sender not verified)

---

## 📋 Alternative: Authenticate Domain (Recommended for Production)

For better deliverability and to avoid sender verification for each email:

1. **Navigate to Domain Authentication:**
   - https://app.sendgrid.com/settings/sender_auth/domain/create

2. **Add Domain:**
   - Enter: `fagor-automation.com`
   - Follow DNS setup instructions
   - Add CNAME records to domain DNS

3. **Benefits:**
   - No need to verify individual sender emails
   - Better email deliverability
   - Professional SPF/DKIM authentication

---

## 🧪 Test Scripts

### Local Test (test-sendgrid.mjs)
```bash
cd /home/ubuntu
export SENDGRID_API_KEY="your_key_here"
node test-sendgrid.mjs
```

### Production Test
After updating Railway environment variable, check logs:
```bash
# In Railway dashboard → Deployments → View Logs
# Look for FAGOR Drip messages
```

---

## 📊 Expected Behavior After Fix

### Successful Email Send:
```
[FAGOR Drip] Starting drip campaign processing...
[FAGOR Drip] Found 46 pending emails (Email 1: 46, Email 2: 0, Email 3: 0)
[FAGOR Drip] ✅ Sent Email 1 to jmartinez@lspceram.com (enrollment 1)
[FAGOR Drip] ✅ Sent Email 1 to schen@markforged.com (enrollment 2)
...
[FAGOR Drip] Completed: 46 sent, 0 failed
```

### Common Errors After Fix:

**403 Forbidden:**
```
❌ Failed to send Email 1 to xxx@xxx.com: Forbidden
```
- **Cause:** Sender email not verified
- **Fix:** Complete Step 2 (Verify Sender Email)

**400 Bad Request:**
```
❌ Failed to send Email 1 to xxx@xxx.com: Bad Request
```
- **Cause:** Invalid email format or missing required fields
- **Fix:** Check email template and recipient email format

---

## 🔗 Useful Links

- **SendGrid Dashboard:** https://app.sendgrid.com/
- **API Keys:** https://app.sendgrid.com/settings/api_keys
- **Sender Authentication:** https://app.sendgrid.com/settings/sender_auth
- **Domain Authentication:** https://app.sendgrid.com/settings/sender_auth/domain/create
- **SendGrid Documentation:** https://docs.sendgrid.com/

---

## 📝 Summary

**Problem:** SendGrid API key is invalid/expired  
**Solution:** Generate new API key and update Railway environment variable  
**Time to Fix:** ~10 minutes  
**Impact:** Will enable 46 pending FAGOR campaign emails to send

**Next Steps:**
1. ✅ Create new SendGrid API key
2. ✅ Verify sender email (service@fagor-automation.com)
3. ✅ Update SENDGRID_API_KEY in Railway
4. ✅ Wait for automatic redeploy
5. ✅ Verify emails sending in Railway logs

---

**Last Updated:** November 30, 2025  
**Status:** Awaiting new API key from user
