# Incoming Messages Testing Guide - WhatsApp Bot

## Problem Analysis

Your backend is currently **NOT receiving incoming messages from WhatsApp** because:

1. **Missing Environment Variables** ❌
   - `WHATSAPP_ACCESS_TOKEN` is not set
   - `WHATSAPP_PHONE_NUMBER_ID` is not set
   - `VERIFY_TOKEN` is not set

2. **Webhook Not Verified** ❌
   - Meta cannot verify your webhook without correct VERIFY_TOKEN
   - Meta will not send messages if webhook verification fails

3. **Backend Cannot Send Responses** ❌
   - Without access token and phone number ID, bot can't send messages back to user

---

## Step 1: Verify Webhook is Configured

### In Meta Business Suite:

1. Go to: **WhatsApp > API Setup > Webhook**
2. Check these settings:

```
Callback URL: https://your-ngrok-url/webhook
Verify Token: (must match VERIFY_TOKEN in .env)
Subscribed Events: 
  ✓ messages
  ✓ message_template_status_update
  ✓ message_template_quality_update
  ✓ statuses
```

3. Click **Verify and Save**

### Expected Result in Terminal:

```
Webhook verification attempt:
Mode: subscribe
Token received: your_token_here
Token expected: your_token_here
Webhook verified successfully! ✓
```

---

## Step 2: Add Required Environment Variables

### Create `.env` file in project root:

```env
# ==================== WEBHOOK ====================
VERIFY_TOKEN=my_super_secret_verify_token_12345

# ==================== WHATSAPP CREDENTIALS ====================
WHATSAPP_ACCESS_TOKEN=EAABsbCS1iHgBAMjPQZC...
WHATSAPP_PHONE_NUMBER_ID=945940578601053
WHATSAPP_API_VERSION=v22.0

# ==================== SERVER ====================
PORT=3000
NODE_ENV=development
BASE_URL=https://abc123.ngrok.io

# ==================== WHATSAPP FLOWS ====================
WHATSAPP_FLOW_ID_8A=1234567890
WHATSAPP_FLOW_ID_712=1234567891
WHATSAPP_FLOW_ID_FERFAR=1234567892
WHATSAPP_FLOW_ID_PROPERTY=1234567893

# ==================== PAYMENT ====================
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret

# ==================== DATABASE ====================
DATA_DIR=./data
```

---

## Step 3: Testing Incoming Messages

### Test 1: Webhook Verification (Manual)

**URL:**
```
GET https://your-ngrok-url/webhook?hub.mode=subscribe&hub.verify_token=my_super_secret_verify_token_12345&hub.challenge=12345678
```

**Expected Response:**
```
Status: 200
Body: 12345678
```

**Terminal Output:**
```
Webhook verification attempt:
Mode: subscribe
Token received: my_super_secret_verify_token_12345
Token expected: my_super_secret_verify_token_12345
Webhook verified successfully! ✓
```

---

### Test 2: Simulate Incoming Message (Postman)

**Setup Postman:**

1. Create new POST request
2. URL: `https://your-ngrok-url/webhook`
3. Headers:
   ```
   Content-Type: application/json
   ```
4. Body (raw JSON):

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "1234567890",
              "phone_number_id": "945940578601053"
            },
            "messages": [
              {
                "from": "919876543210",
                "id": "wamid.test.123",
                "timestamp": "1234567890",
                "type": "text",
                "text": {
                  "body": "hi"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

5. Click **Send**

**Expected Terminal Output:**

```
RAW WEBHOOK RECEIVED: {
  "object": "whatsapp_business_account",
  "entry": [...]
}

Received 1 message(s)

--- Message Details ---
From: 919876543210
Type: text
ID: wamid.test.123
Timestamp: 1234567890
Text content: hi

=== PROCESSING MESSAGE ===
From: 919876543210
Text: hi
Type: text

User: New user (919876543210)
Detected greeting -> Sending welcome message with service buttons

=== SENDING WHATSAPP MESSAGE ===
To: 919876543210
Message Type: interactive
API URL: https://graph.facebook.com/v22.0/945940578601053/messages
Request Payload: { ... }
```

---

### Test 3: Real WhatsApp Message

**Send from Real WhatsApp Number:**

1. Open WhatsApp on your phone
2. Find your bot's phone number
3. Send message: `hi`

**Expected Result:**

✅ Bot responds with welcome message and 4 service buttons in WhatsApp app

**Terminal Output Should Show:**
```
RAW WEBHOOK RECEIVED: { ... }
From: 919876543210
Type: text
Text content: hi
User: New user (919876543210)
Detected greeting -> Sending welcome message with service buttons
=== SENDING WHATSAPP MESSAGE ===
```

---

## Step 4: Troubleshooting

### Problem: Webhook Verification Failed

**Symptom:**
```
Webhook verification attempt:
Token received: my_token
Token expected: my_different_token
Webhook verification failed - token mismatch
```

**Solution:**
1. Copy `VERIFY_TOKEN` value from `.env`
2. Go to Meta Business Suite > WhatsApp > API Setup > Webhook
3. Paste the EXACT same value in "Verify Token" field
4. Click "Verify and Save"

---

### Problem: "Missing environment variables: WHATSAPP_ACCESS_TOKEN"

**Symptom:**
Terminal shows warning on startup:
```
WARNING: Missing environment variables: WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID
```

**Solution:**
1. Open `.env` file
2. Add: `WHATSAPP_ACCESS_TOKEN=your_token`
3. Restart server: `npm run dev`

---

### Problem: Webhook sends message to terminal but not to WhatsApp

**Symptom:**
Terminal shows:
```
=== SENDING WHATSAPP MESSAGE ===
CANNOT SEND - Missing real WhatsApp credentials
```

**Solution:**
1. Check `.env` has real token (not "test" or placeholder)
2. Check token is 100+ characters long
3. Token should start with `EAA...`
4. Verify in Meta Business Suite it's still valid (temporary tokens expire)

---

### Problem: "WhatsApp API Error: 401 Unauthorized"

**Symptom:**
Terminal shows:
```
WhatsApp API Error:
Status: 401
Error Data: { error: { code: 401, ... } }
```

**Solution:**
- Access token is invalid or expired
- Get a new permanent token from Meta Business Suite
- Temporary tokens last only a few hours

---

### Problem: "WhatsApp API Error: 400 Bad Request"

**Symptom:**
Terminal shows:
```
WhatsApp API Error:
Status: 400
Error Data: { error: { code: 400, message: "Invalid recipient" } }
```

**Possible Causes:**
1. Phone number format wrong (should be `919876543210` with country code)
2. Phone number ID is wrong
3. Message payload is malformed

**Solution:**
1. Verify phone number has country code (e.g., `919876543210` not `9876543210`)
2. Verify WHATSAPP_PHONE_NUMBER_ID is correct (not the phone number, the ID)
3. Check message structure is valid

---

## Step 5: Complete Message Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ YOUR WHATSAPP (919876543210)                            │
│ Type "hi" in chat to bot's number                       │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ HTTPS (encrypted)
                         │
                         v
        ┌─────────────────────────────────────┐
        │ Meta WhatsApp Server                │
        │ Receives message                    │
        └────────────────┬────────────────────┘
                         │
                         │ POST webhook
                         │
                         v
        ┌─────────────────────────────────────┐
        │ ngrok tunnel                        │
        │ Routes to your local server         │
        └────────────────┬────────────────────┘
                         │
                         v
        ┌─────────────────────────────────────┐
        │ Your Backend (localhost:3000)       │
        │ POST /webhook                       │
        └────────────────┬────────────────────┘
                         │
                         v
        ┌─────────────────────────────────────┐
        │ webhook.controller.js               │
        │ handleWebhook() processes message   │
        └────────────────┬────────────────────┘
                         │
                         v
        ┌─────────────────────────────────────┐
        │ message.controller.js               │
        │ handleMessage(from, "hi")           │
        │ Detects greeting                    │
        └────────────────┬────────────────────┘
                         │
                         v
        ┌─────────────────────────────────────┐
        │ whatsapp.service.js                 │
        │ sendMessage(from, welcomeMessage)   │
        └────────────────┬────────────────────┘
                         │
                         v
        ┌─────────────────────────────────────┐
        │ Meta Graph API                      │
        │ POST /messages                      │
        │ With credentials:                   │
        │ - Access Token                      │
        │ - Phone Number ID                   │
        └────────────────┬────────────────────┘
                         │
                         v
        ┌─────────────────────────────────────┐
        │ Meta WhatsApp Server                │
        │ Queues message for delivery         │
        └────────────────┬────────────────────┘
                         │
                         v
┌─────────────────────────────────────────────────────────┐
│ YOUR WHATSAPP (919876543210)                            │
│ Receives welcome message with 4 buttons ✅              │
└─────────────────────────────────────────────────────────┘
```

---

## Step 6: Quick Checklist

Before testing, verify:

- [ ] `.env` file exists in project root
- [ ] `VERIFY_TOKEN` is set and matches Meta Dashboard
- [ ] `WHATSAPP_ACCESS_TOKEN` is set (starts with `EAA...`)
- [ ] `WHATSAPP_PHONE_NUMBER_ID` is set (the ID, not phone number)
- [ ] Server running: `npm run dev`
- [ ] ngrok running: `ngrok http 3000`
- [ ] ngrok URL copied to `BASE_URL` in `.env`
- [ ] ngrok URL added to Meta Dashboard webhook URL
- [ ] Webhook verified in Meta Dashboard ✓

---

## Summary

**Why Messages Weren't Coming In:**
1. Missing env variables → Webhook can't verify → Meta doesn't send messages
2. No credentials → Can't send response → User sees nothing

**To Fix:**
1. Add all env variables to `.env`
2. Update Meta Dashboard webhook URL and verify token
3. Restart server
4. Send "hi" to bot's WhatsApp number
5. Check terminal for "Detected greeting" message
6. See response in WhatsApp! ✅

**Testing Order:**
1. Webhook verification (terminal log)
2. Postman test (webhook receives JSON)
3. Real WhatsApp message (bot responds)

---

## Need Help?

1. **Check terminal logs** - Most issues visible in console output
2. **Verify credentials** - VERIFY_TOKEN especially often wrong
3. **Check ngrok URL** - Changes on restart, must be updated
4. **Check .env file** - Make sure all values are present and correct
5. **Review detailed comments** - Check `/src/controllers/webhook.controller.js` for complete flow explanation
