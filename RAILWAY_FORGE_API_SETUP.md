# Railway - Manus Forge API Configuration Guide

## Problem

The Meta-Agent chat is failing in Railway production with error:
```
Error: LLM invoke failed: Cannot resolve API hostname - check network connectivity
```

**Root cause:** The `BUILT_IN_FORGE_API_KEY` environment variable in Railway contains a placeholder value (`tu_forge_api_key_de_manus`) instead of the actual Manus Forge API key.

---

## Solution

Update the Railway environment variables with the correct Manus Forge API credentials.

### Step 1: Access Railway Variables

1. Go to https://railway.app/
2. Select project: **ivy-ai-platform**
3. Click on the **ivy-ai-platform** service (not MySQL)
4. Go to **Variables** tab

### Step 2: Update BUILT_IN_FORGE_API_KEY

1. Find `BUILT_IN_FORGE_API_KEY` in the list
2. Click the three dots (⋮) on the right
3. Click **Edit**
4. Replace the current value with:
   ```
   4DLC76r4J5odFXavWVnFcu
   ```
5. Click **Save** or press Enter

### Step 3: Verify BUILT_IN_FORGE_API_URL

1. Check if `BUILT_IN_FORGE_API_URL` exists
2. It should be set to:
   ```
   https://forge.manus.ai
   ```
3. If it doesn't exist, create it:
   - Click **+ New Variable**
   - Name: `BUILT_IN_FORGE_API_URL`
   - Value: `https://forge.manus.ai`
   - Click **Add**

### Step 4: Wait for Redeploy

- Railway will automatically redeploy the service (~3-5 minutes)
- Watch the deployment logs to confirm it completes successfully

### Step 5: Test the Fix

1. Go to: https://ivy-ai-platform-production.up.railway.app/meta-agent
2. Send a message like "hola" or "¿cómo estás?"
3. You should receive a natural conversational response from the LLM
4. No more "fetch failed" or "connectivity" errors

---

## Expected Behavior After Fix

**Before (with placeholder key):**
```
Meta-Agent: ¡Hola! Hay un problema de conectividad temporal. Puedo ayudarte con comandos específicos...
```

**After (with correct key):**
```
Meta-Agent: ¡Hola! Estoy muy bien, gracias por preguntar. ¿Y tú, cómo estás? 😊
```

---

## Technical Details

### Why This Happens

- **Local development:** Manus platform automatically injects `BUILT_IN_FORGE_API_KEY` when running in Manus sandbox
- **Railway production:** External deployment requires manual configuration of all environment variables
- **Placeholder values:** The template includes placeholder values that need to be replaced with real credentials

### What We Fixed

1. ✅ Added retry logic with exponential backoff (3 attempts: 1s, 2s, 4s)
2. ✅ Better error messages for DNS/network failures
3. ✅ Helpful fallback responses when LLM is unavailable
4. ✅ Extracted correct credentials from local environment
5. ⏳ **Pending:** Update Railway variables (manual step by user)

---

## Troubleshooting

### If chat still doesn't work after updating:

1. **Check deployment logs:**
   - Railway → Deployments tab
   - Look for errors during startup

2. **Verify variables are set:**
   - Railway → Variables tab
   - Confirm both `BUILT_IN_FORGE_API_KEY` and `BUILT_IN_FORGE_API_URL` are present

3. **Test API key locally:**
   ```bash
   curl -X POST https://forge.manus.ai/v1/chat/completions \
     -H "Authorization: Bearer 4DLC76r4J5odFXavWVnFcu" \
     -H "Content-Type: application/json" \
     -d '{"model":"gemini-2.5-flash","messages":[{"role":"user","content":"test"}]}'
   ```

4. **Check Railway logs for LLM errors:**
   - Railway → Logs tab
   - Filter for: `[Chat Handler]` or `[LLM]`

---

## Next Steps After Fix

1. **Test all Meta-Agent features:**
   - Conversational chat ✅
   - Commands (status, fix errors, train agents) ✅
   - Auto-training and audits ✅

2. **Monitor for 24 hours:**
   - Check that scheduled tasks run correctly
   - Verify no more DNS/network errors

3. **Populate agents table:**
   - Add agent records to database
   - This will eliminate "Agents query returned invalid data" warnings
   - Improve platform health status

---

**Created:** 2025-11-30  
**Status:** Pending user action to update Railway variables
