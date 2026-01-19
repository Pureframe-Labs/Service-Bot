# Complete WhatsApp Bot Setup Guide

## Problem Identified

Your bot **is not receiving/sending messages** because:

1. ❌ **Environment variables are missing** (WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, VERIFY_TOKEN)
2. ❌ **Webhook is not verified** with Meta (no VERIFY_TOKEN match)
3. ❌ **Meta Dashboard webhook is not configured** with your ngrok URL

---

## The Complete Flow (What Happens)

```
INCOMING →
You send "hi" on WhatsApp
    ↓
Meta WhatsApp Server receives it
    ↓
Meta sends webhook POST to: https://your-ngrok-url/webhook
    ↓
Your backend receives it:
  - webhook.controller.js processes it
  - message.controller.js detects "hi"
  - whatsapp.service.js prepares response
    ↓
whatsapp.service.js makes API call to Meta:
  POST https://graph.facebook.com/v22.0/{phone_number_id}/messages
  Headers: Authorization: Bearer {access_token}
  Body: {to: "919876543210", text: {body: "Welcome..."}}
    ↓
Meta WhatsApp Server receives message
    ↓
You receive welcome message on WhatsApp ✅

← OUTGOING
```

---

## Step-by-Step Setup

### PHASE 1: Get Credentials from Meta (10 mins)

#### 1.1: Get WHATSAPP_ACCESS_TOKEN

**Option A: Temporary Token (for testing)**
```
1. Go: https://developers.facebook.com/apps/
2. Select your WhatsApp app
3. WhatsApp > API Setup
4. Copy: Temporary Access Token (under Your access token)
5. Expires in: 24 hours
```

**Option B: Permanent Token (recommended)**
```
1. Go: Meta Business Suite (business.facebook.com)
2. Settings > System Users
3. Click Create System User
4. Name it: WhatsApp Bot
5. Role: Admin
6. Save
7. Click on user > Generate new token
8. Select App: Your WhatsApp app
9. Select permissions: whatsapp_business_messaging
10. Copy the token
11. This token lasts until you revoke it
```

**Token Format:**
```
Starts with: EAA
Length: 100+ characters
Example: EAA1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRST...
```

#### 1.2: Get WHATSAPP_PHONE_NUMBER_ID

```
1. Go: Meta Business Suite (business.facebook.com)
2. WhatsApp > Phone Numbers
3. Click on your phone number
4. Copy: Phone Number ID (NOT the phone number!)
5. Example: 945940578601053
```

**IMPORTANT:**
- ❌ Don't use the phone number itself (919876543210)
- ✅ Use the Phone Number ID (945940578601053)

#### 1.3: Create VERIFY_TOKEN

```
Just create a random string (20+ characters):
Example: my_super_secret_verify_token_12345

This is YOUR token - you define it
Meta doesn't provide this - you create it
```

---

### PHASE 2: Set Up Environment Variables (5 mins)

#### 2.1: Create `.env` File

```bash
# In your project root, run:
cp .env.template .env
```

#### 2.2: Fill in the `.env` File

Open `.env` and add:

```env
# Required credentials
VERIFY_TOKEN=my_super_secret_verify_token_12345
WHATSAPP_ACCESS_TOKEN=EAA1234567890abcdefghijklmnop...
WHATSAPP_PHONE_NUMBER_ID=945940578601053

# ngrok URL (see step 3)
BASE_URL=https://your_ngrok_url_here.ngrok.io

# Optional but recommended
WHATSAPP_API_VERSION=v22.0
PORT=3000
NODE_ENV=development
DATA_DIR=./data
```

**Save the file!**

---

### PHASE 3: Set Up ngrok Tunnel (5 mins)

**Why ngrok?**
- Your localhost:3000 is not accessible from the internet
- Meta needs to send webhooks to a public URL
- ngrok creates a tunnel to expose your local server

#### 3.1: Download ngrok

```bash
# Go to: https://ngrok.com/download
# Download for your OS
# Extract the file
```

#### 3.2: Run ngrok

```bash
# In a terminal, navigate to ngrok folder
./ngrok http 3000

# Output will show:
# Forwarding                    https://abc123def456.ngrok.io -> http://localhost:3000
```

#### 3.3: Copy the ngrok URL

```
https://abc123def456.ngrok.io  ← Copy this!
```

#### 3.4: Add to .env

```env
BASE_URL=https://abc123def456.ngrok.io
```

**IMPORTANT:**
- ⚠️ ngrok URL changes when you restart ngrok
- 📝 Update `BASE_URL` in .env each time
- 🔄 Also update Meta Dashboard webhook URL each time

---

### PHASE 4: Configure Webhook in Meta Dashboard (10 mins)

#### 4.1: Go to Meta Dashboard

```
1. Go: https://developers.facebook.com/apps/
2. Select your WhatsApp app
3. Go: WhatsApp > API Setup
4. Scroll to: Webhook
```

#### 4.2: Configure Webhook

```
Callback URL: https://abc123def456.ngrok.io/webhook
Verify Token: my_super_secret_verify_token_12345
Subscribed Events:
  ✓ messages
  ✓ message_template_status_update
  ✓ message_template_quality_update
  ✓ statuses
```

#### 4.3: Click "Verify and Save"

**Expected:**
- Green checkmark appears
- "Webhook verified"

**If it fails:**
- Check Callback URL matches exactly (no typo)
- Check Verify Token matches exactly (case-sensitive)
- Check server is running (npm run dev)
- Check ngrok is running

---

### PHASE 5: Start the Bot (2 mins)

```bash
# Terminal 1: Start bot
npm run dev

# Expected output:
# Server running on port 3000
# WhatsApp Service Configuration: Mode: PRODUCTION
```

```bash
# Terminal 2: Keep ngrok running
./ngrok http 3000

# Expected output:
# Forwarding https://abc123def456.ngrok.io -> http://localhost:3000
```

---

### PHASE 6: Test Incoming Messages (5 mins)

#### Test 1: Webhook Verification

```bash
# Copy this URL and paste in browser:
https://abc123def456.ngrok.io/webhook?hub.mode=subscribe&hub.verify_token=my_super_secret_verify_token_12345&hub.challenge=12345678
```

**Expected:**
- Page shows: `12345678`
- Terminal shows: `Webhook verified successfully!`

#### Test 2: Send Real Message

```bash
1. Open WhatsApp on phone
2. Message your bot's number with: hi
3. Check terminal for:
   - RAW WEBHOOK RECEIVED:
   - Text content: hi
   - Detected greeting -> Sending welcome message
```

**Expected Result on Phone:**
- Bot sends back welcome message with 4 service buttons ✅

---

## Complete Environment Variables Reference

| Variable | Value | Source | Example |
|----------|-------|--------|---------|
| **VERIFY_TOKEN** | Random string | You create | `my_secret_token_123` |
| **WHATSAPP_ACCESS_TOKEN** | Auth token | Meta Business Suite | `EAA1234567890abc...` |
| **WHATSAPP_PHONE_NUMBER_ID** | Phone ID | Meta > Phone Numbers | `945940578601053` |
| **BASE_URL** | Public URL | ngrok | `https://abc123.ngrok.io` |
| **WHATSAPP_API_VERSION** | API version | Leave as-is | `v22.0` |
| **PORT** | Server port | Leave as-is | `3000` |
| **NODE_ENV** | Environment | development/production | `development` |
| **DATA_DIR** | Data directory | Leave as-is | `./data` |

---

## Troubleshooting Checklist

### ❌ "Missing environment variables" in terminal

**Fix:**
1. Check `.env` file exists
2. Check all variables are filled (not empty)
3. Restart server: `npm run dev`

### ❌ Webhook verification fails

**Fix:**
1. Copy exact `VERIFY_TOKEN` value from `.env`
2. Go to Meta Dashboard > Webhook
3. Paste EXACT same value in "Verify Token"
4. Callback URL must match ngrok URL (no typo)
5. Server must be running
6. Click "Verify and Save"

### ❌ Message received but no response sent

**Terminal shows:**
```
CANNOT SEND - Missing real WhatsApp credentials
```

**Fix:**
1. Check `WHATSAPP_ACCESS_TOKEN` is not placeholder
2. Token must start with `EAA`
3. If using temporary token, it may have expired
4. Get new permanent token from Meta Business Suite

### ❌ "WhatsApp API Error: 401 Unauthorized"

**Fix:**
- Access token is invalid/expired
- Get new token from Meta Business Suite

### ❌ "WhatsApp API Error: 400 Bad Request"

**Fix:**
- Phone number ID is wrong (copy from Meta > Phone Numbers)
- OR phone number missing country code (use 919876543210 not 9876543210)

### ❌ ngrok URL changed after restart

**Fix:**
1. Restart ngrok: `./ngrok http 3000`
2. Copy new HTTPS URL
3. Update `BASE_URL` in `.env`
4. Update `Callback URL` in Meta Dashboard webhook
5. Click "Verify and Save" again

---

## File Structure

```
project-root/
├── server.js                    ← Starts the bot
├── .env                        ← Your credentials (DON'T COMMIT)
├── .env.template              ← Template (safe to commit)
├── .gitignore                 ← Already includes .env
├── BACKEND_SETUP_REQUIRED.md  ← What credentials you need
├── INCOMING_MESSAGES_GUIDE.md ← How to test messages
├── COMPLETE_SETUP_GUIDE.md    ← This file
├── src/
│   ├── app.js                 ← Express app setup
│   ├── controllers/
│   │   ├── webhook.controller.js    ← Receives messages
│   │   └── message.controller.js    ← Processes messages
│   ├── services/
│   │   ├── whatsapp.service.js      ← Sends messages
│   │   └── database.service.js      ← Stores data
│   └── routes/
│       └── webhook.routes.js        ← /webhook endpoint
└── data/
    ├── users.json
    ├── orders.json
    └── sessions.json
```

---

## Security Notes

🔒 **DO:**
- Keep `.env` file safe (not in git)
- Use `.gitignore` to exclude `.env`
- Rotate tokens regularly in production
- Use permanent tokens (not temporary)

🔓 **DON'T:**
- Commit `.env` to git
- Share your access token
- Use placeholder values in production
- Log sensitive data

---

## Next Steps After Setup Works

1. **Create WhatsApp Flows** (optional)
   - Go to Meta > WhatsApp > Flows
   - Create form flows for each service
   - Add Flow IDs to .env

2. **Test Form Submission**
   - Click a service button
   - Fill the form
   - Submit
   - Should receive payment link

3. **Set Up Payment Gateway**
   - Add Razorpay credentials to .env
   - Test payment flow

4. **Monitor in Production**
   - Check bot logs regularly
   - Verify messages deliver
   - Track orders

---

## Quick Command Reference

```bash
# Start bot
npm run dev

# Start ngrok
./ngrok http 3000

# Kill process using port 3000 (if needed)
# Linux/Mac:
lsof -ti:3000 | xargs kill -9
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Check .env file is valid
cat .env

# View terminal logs
# Already shown when running npm run dev
```

---

## Support

If still having issues:

1. **Read detailed comments** in `/src/controllers/webhook.controller.js`
2. **Check terminal logs** carefully - they usually explain the problem
3. **Verify all 3 credentials** match exactly between .env and Meta Dashboard
4. **Ensure ngrok is running** and URL is current
5. **Check Meta Dashboard webhook** is verified (green checkmark)

---

## Summary

Your bot works like this:

1. **You send message** → WhatsApp
2. **Meta sends webhook** → ngrok → your backend
3. **Backend processes** → message.controller.js
4. **Backend responds** → whatsapp.service.js makes API call
5. **Meta sends message** → your phone ✅

**Currently broken at step 2** because webhook can't verify without VERIFY_TOKEN.

**To fix:** Follow Phase 1-4 above to get credentials and configure webhook.

**Then test:** Send "hi" to bot's WhatsApp number and check terminal logs.

Good luck! 🚀
