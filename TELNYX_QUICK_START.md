# 📞 Telnyx Quick Start Guide for Ivy.AI Demos

**Goal:** Get Telnyx configured in 30 minutes to demo automated calling with Ivy-Call  
**Cost:** ~$1-2/month for phone number + $0.01/minute for calls  
**Timeline:** 15-30 minutes

---

## 🚀 TL;DR (For Experienced Users)

1. Create Telnyx account → Get API Key
2. Buy US phone number ($1-2/month)
3. Create Outbound Voice Profile → Get Connection ID
4. Configure webhook: `https://YOUR-DOMAIN.manus.space/api/webhooks/telnyx`
5. Add secrets to Ivy.AI Management Dashboard:
   - `TELNYX_API_KEY`
   - `TELNYX_PHONE_NUMBER`
   - `TELNYX_CONNECTION_ID`
6. Test with a call to your personal phone

---

## 📋 Step-by-Step Setup (30 Minutes)

### **Step 1: Create Telnyx Account (5 minutes)**

1. Go to [https://telnyx.com/sign-up](https://telnyx.com/sign-up)
2. Enter your email and create a password
3. Verify your email (check spam folder)
4. Add payment method (credit card)
   - ⚠️ **Note:** You won't be charged until you buy a number

**✅ Checkpoint:** You should be logged into Telnyx Portal

---

### **Step 2: Get Your API Key (2 minutes)**

1. In Telnyx Portal, click **API Keys** in left sidebar
2. Click **Create API Key** button (top right)
3. Name it: `Ivy.AI Production`
4. Click **Create**
5. **COPY THE API KEY IMMEDIATELY** (you can't see it again!)
   - It looks like: `KEY017ABC...` (long string)
6. Paste it somewhere safe (Notes app, password manager)

**✅ Checkpoint:** You have your API Key saved

---

### **Step 3: Buy a Phone Number (5 minutes)**

1. Click **Numbers** → **Buy Numbers** in left sidebar
2. Select **Country**: United States
3. Select **Type**: Local (cheapest option, $1-2/month)
4. Enter any US area code (e.g., `415` for San Francisco, `212` for NYC)
5. Click **Search**
6. Pick any available number from the list
7. Click **Buy** → Confirm purchase

**💰 Cost:** $1-2/month (billed monthly)

**✅ Checkpoint:** You own a phone number (visible in "My Numbers")

---

### **Step 4: Create Outbound Voice Profile (3 minutes)**

1. Click **Voice** → **Outbound Voice Profiles** in left sidebar
2. Click **Create New Profile** button
3. Fill in:
   - **Name**: `Ivy.AI Outbound Calls`
   - **Billing Group**: Select the default one
   - **Traffic Type**: Conversational
4. Click **Save**
5. **COPY THE CONNECTION ID** from the profile details
   - It looks like: `1234567890` (numeric ID)
6. Save it with your API Key

**✅ Checkpoint:** You have your Connection ID saved

---

### **Step 5: Link Number to Profile (2 minutes)**

1. Click **Numbers** → **My Numbers**
2. Click on your phone number
3. Scroll to **Voice Settings** section
4. Set **Connection**: Select `Ivy.AI Outbound Calls` (your profile)
5. Click **Save**

**✅ Checkpoint:** Your number is linked to the outbound profile

---

### **Step 6: Configure Webhook (5 minutes)**

1. Click **Webhooks** in left sidebar
2. Click **Add Webhook** button
3. Fill in:
   - **Webhook URL**: `https://YOUR-DOMAIN.manus.space/api/webhooks/telnyx`
     - Replace `YOUR-DOMAIN` with your actual Ivy.AI domain
     - Example: `https://3000-abc123.manus.space/api/webhooks/telnyx`
   - **Webhook API Version**: V2
4. Select these events (scroll down to find them):
   - ✅ `call.initiated`
   - ✅ `call.answered`
   - ✅ `call.hangup`
   - ✅ `call.recording.saved`
5. Click **Save**

**✅ Checkpoint:** Webhook is configured and active

---

### **Step 7: Add Secrets to Ivy.AI (5 minutes)**

1. Open your Ivy.AI platform
2. Click **Management UI** icon (top right)
3. Go to **Settings** → **Secrets**
4. Click **Add Secret** (3 times, once for each)

**Secret 1:**
- **Key**: `TELNYX_API_KEY`
- **Value**: Paste your API Key from Step 2

**Secret 2:**
- **Key**: `TELNYX_PHONE_NUMBER`
- **Value**: Your phone number in E.164 format
  - Example: `+14155551234` (must start with `+1` for US)
  - Find it in Telnyx Portal → My Numbers

**Secret 3:**
- **Key**: `TELNYX_CONNECTION_ID`
- **Value**: Paste your Connection ID from Step 4

5. Click **Save** for each secret

**✅ Checkpoint:** All 3 secrets are saved in Ivy.AI

---

### **Step 8: Test Your Setup (3 minutes)**

1. In Ivy.AI, go to **Leads** page
2. Click on any lead
3. Click **Call Lead** button (or similar)
4. Enter YOUR personal phone number (for testing)
5. Click **Initiate Call**

**Expected Result:**
- Your phone should ring within 5-10 seconds
- You'll hear Ivy-Call's voice introduction
- Call details appear in **Call History** page

**If it doesn't work:**
- Check that all 3 secrets are correct (no extra spaces)
- Verify webhook URL is correct (check for typos)
- Check Telnyx balance (must have $5+ credit)
- See Troubleshooting section below

---

## 🎯 Quick Reference Card

Keep this handy for demos:

| Item | Value | Where to Find |
|------|-------|---------------|
| **API Key** | `KEY017ABC...` | Telnyx Portal → API Keys |
| **Phone Number** | `+14155551234` | Telnyx Portal → My Numbers |
| **Connection ID** | `1234567890` | Telnyx Portal → Outbound Voice Profiles |
| **Webhook URL** | `https://YOUR-DOMAIN.manus.space/api/webhooks/telnyx` | Your Ivy.AI domain |
| **Cost per Call** | ~$0.01/minute | Varies by destination |
| **Monthly Cost** | $1-2 (number) + usage | Billed monthly |

---

## 🐛 Troubleshooting

### **Problem: Call doesn't initiate**

**Possible Causes:**
1. **Insufficient Balance** - Add $10 to Telnyx account
   - Go to Telnyx Portal → Billing → Add Credit
2. **Wrong API Key** - Double-check for typos or extra spaces
3. **Number not linked to profile** - Repeat Step 5
4. **Connection ID incorrect** - Verify in Outbound Voice Profiles

**How to Debug:**
- Check Telnyx Portal → Call Logs (shows attempted calls)
- Check Ivy.AI logs for error messages
- Try calling from Telnyx Portal directly (test their system)

---

### **Problem: Call connects but no audio**

**Possible Causes:**
1. **Webhook not configured** - Repeat Step 6
2. **Webhook URL incorrect** - Check for typos
3. **Firewall blocking webhook** - Unlikely with Manus hosting

**How to Debug:**
- Check Telnyx Portal → Webhooks → View Logs
- Look for 200 OK responses (means webhook is working)
- Check Ivy.AI server logs for incoming webhook events

---

### **Problem: Call works but doesn't record**

**Possible Causes:**
1. **Recording not enabled** - Check Ivy-Call agent config
2. **Webhook event missing** - Ensure `call.recording.saved` is selected

**How to Fix:**
- Go to Telnyx Portal → Webhooks
- Edit your webhook
- Ensure `call.recording.saved` is checked
- Save and retry

---

## 💰 Cost Breakdown

### **One-Time Costs:**
- **Account Setup:** Free
- **API Key:** Free

### **Monthly Costs:**
- **Phone Number (Local):** $1-2/month
- **Phone Number (Toll-Free):** $5/month
- **International Numbers:** Varies ($2-20/month)

### **Per-Call Costs:**
- **US Domestic:** $0.004-0.01/minute (~$0.01/minute average)
- **International:** $0.02-0.50/minute (varies by country)
- **Recording Storage:** $0.0007/minute (negligible)

### **Example Monthly Bill (100 calls):**
- Phone number: $2
- 100 calls × 3 minutes avg × $0.01/min = $3
- **Total: ~$5/month**

### **Example Monthly Bill (1,000 calls):**
- Phone number: $2
- 1,000 calls × 3 minutes avg × $0.01/min = $30
- **Total: ~$32/month**

**ROI Calculation:**
- If Ivy-Call converts just 1 extra lead/month worth $500
- ROI = ($500 - $32) / $32 = **1,462% ROI**

---

## 🎤 Demo Script for Clients

When demoing Telnyx integration to clients, say this:

> "Ivy-Call integrates with Telnyx, a business phone API. Setup takes 30 minutes and costs about $2/month for the phone number plus a penny per minute for calls. 
>
> Once configured, Ivy-Call can automatically call qualified leads, deliver personalized voicemails, answer common questions, and schedule follow-ups. Everything is tracked in the Call History dashboard.
>
> Our beta clients are using this to reach 10x more leads without hiring more SDRs. The ROI is instant - if just one call converts to a $500 deal, you've paid for a year of service."

---

## 📞 Alternative: Use Your Own Number (Advanced)

If you already have a business phone system (RingCentral, Vonage, etc.), you can port your number to Telnyx:

**Pros:**
- Keep your existing number (customers recognize it)
- No need to update business cards, website, etc.

**Cons:**
- Takes 7-14 days to complete port
- Requires LOA (Letter of Authorization) from current provider
- Costs $10-20 porting fee

**When to Do This:**
- After beta testing (don't port during beta)
- When you're confident Ivy-Call works for your use case
- When you want to consolidate phone systems

**How to Port:**
1. Telnyx Portal → Numbers → Port Numbers
2. Follow the wizard (need account number from current provider)
3. Telnyx handles the rest

---

## 🔐 Security Best Practices

### **Protect Your API Key:**
- ❌ Never commit API keys to Git
- ❌ Never share API keys in Slack/email
- ✅ Store in Ivy.AI Secrets (encrypted)
- ✅ Rotate keys every 90 days
- ✅ Use separate keys for dev/staging/production

### **Webhook Security:**
- Telnyx signs webhook payloads with HMAC
- Ivy.AI automatically verifies signatures
- If webhook URL is compromised, regenerate it in Telnyx Portal

### **Compliance:**
- **TCPA (US):** Only call leads who opted in
- **GDPR (EU):** Get consent before calling EU residents
- **Do Not Call Lists:** Check against DNC registry
- Ivy.AI includes compliance features (opt-out tracking)

---

## 🚀 Next Steps After Setup

Once Telnyx is configured:

1. **Test with 5-10 calls** to your own phone
2. **Refine Ivy-Call's script** based on how it sounds
3. **Call 10 real leads** (low-risk ones)
4. **Collect feedback** from your sales team
5. **Scale up** to 50-100 calls/day
6. **Monitor metrics** (answer rate, conversion rate)
7. **Optimize** based on data

---

## 📚 Additional Resources

- **Telnyx Docs:** [https://developers.telnyx.com/](https://developers.telnyx.com/)
- **Telnyx Support:** support@telnyx.com (24/7 email support)
- **Telnyx Community:** [https://community.telnyx.com/](https://community.telnyx.com/)
- **Ivy.AI Support:** [https://help.manus.im](https://help.manus.im)

---

## ✅ Setup Complete!

You're now ready to demo automated calling with Ivy-Call. 

**Pro Tip for Demos:**
- Call your own phone first to show it works
- Have a backup plan (show Call History with past calls)
- Explain the ROI (1 converted call = 1 year of service paid for)
- Emphasize compliance features (opt-out, DNC checking)

**Questions?** Check the full `TELNYX_SETUP.md` guide for advanced configuration.

---

**Happy calling! 📞🚀**
