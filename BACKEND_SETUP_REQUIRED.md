# Backend Setup Requirements - What You Need to Provide

## Overview
The bot requires specific credentials from Meta's WhatsApp Business Platform to:
1. **Receive messages** from users (webhook incoming)
2. **Send messages** to users (API outgoing)
3. **Trigger flows** (WhatsApp forms)

---

## 1. WHATSAPP_ACCESS_TOKEN ⚠️ MOST IMPORTANT

### What it is:
A security token that allows your backend to send messages to WhatsApp users through Meta's API.

### Where to get it:
**Option A: Temporary Token (for testing)**
1. Go to: https://developers.facebook.com/apps/
2. Select your WhatsApp app
3. Go to: WhatsApp > API Setup
4. Copy the "Temporary Access Token"
5. Add to `.env`: `WHATSAPP_ACCESS_TOKEN=your_token_here`

**Option B: Permanent Token (recommended for production)**
1. Go to: Meta Business Suite
2. Settings > System Users
3. Create a new system user (give it admin access)
4. Generate a token with permissions: `whatsapp_business_messaging`
5. Add to `.env`: `WHATSAPP_ACCESS_TOKEN=your_permanent_token`

### How to verify it works:
- Token should be ~100+ characters long
- It starts with `EAA...` or similar prefix
- DO NOT share or commit this token to git

---

## 2. WHATSAPP_PHONE_NUMBER_ID ⚠️ CRITICAL

### What it is:
The ID of your WhatsApp Business phone number. This tells the API which phone number to send messages from.

### Where to get it:
1. Go to: Meta Business Suite
2. WhatsApp > Phone Numbers
3. Click on your phone number
4. Copy the "Phone Number ID" (NOT the phone number itself)
5. Add to `.env`: `WHATSAPP_PHONE_NUMBER_ID=945940578601053`

### Example values:
- ❌ Wrong: `919876543210` (this is the phone number)
- ✅ Correct: `945940578601053` (this is the ID)

### How to verify it works:
- Should be 10-15 digit number
- Must be exact - even one digit wrong will cause API failures

---

## 3. VERIFY_TOKEN ⚠️ FOR WEBHOOK VERIFICATION

### What it is:
A security token YOU create (just a random string) that Meta uses to verify webhook requests are from legitimate sources.

### How to set it:
1. Open `.env`
2. Create a random token: `VERIFY_TOKEN=my_super_secret_random_token_12345`
3. Make it long and random (20+ characters)
4. Add to `.env`: `VERIFY_TOKEN=your_random_token`

### Then configure in Meta Dashboard:
1. Go to: Meta Business Suite > WhatsApp > API Setup
2. Under "Webhook":
   - Callback URL: `https://your-ngrok-url.ngrok.io/webhook` (replace with real ngrok URL)
   - Verify Token: `your_random_token` (same value as in .env)
   - Subscribed Events: 
     - ✅ messages
     - ✅ statuses
3. Click "Verify and Save"

---

## 4. NGROK URL (for local testing)

### What it is:
A tunnel that exposes your local `localhost:3000` to the internet so Meta can reach it.

### Setup:
1. Download ngrok: https://ngrok.com/download
2. Run your bot: `npm run dev`
3. In another terminal, run: `ngrok http 3000`
4. Copy the HTTPS URL shown (e.g., `https://abc123.ngrok.io`)
5. Use this URL in Meta Dashboard webhook configuration

### Important:
- ngrok URL changes every restart (unless you have paid account)
- Update Meta Dashboard webhook URL each time
- Use HTTPS URL (not HTTP)

---

## 5. COMPLETE .env EXAMPLE

```env
# ============ WHATSAPP CREDENTIALS ============
# Get from Meta Business Suite
WHATSAPP_ACCESS_TOKEN=EAA1234567890abcdefg...
WHATSAPP_PHONE_NUMBER_ID=945940578601053
VERIFY_TOKEN=my_super_secret_random_token_12345

# ============ API CONFIGURATION ============
WHATSAPP_API_VERSION=v22.0
PORT=3000
NODE_ENV=development
BASE_URL=https://abc123.ngrok.io

# ============ WHATSAPP FLOWS ============
# Create flows in Meta Business Suite and add IDs here
WHATSAPP_FLOW_ID_8A=flow_id_from_meta
WHATSAPP_FLOW_ID_712=flow_id_from_meta
WHATSAPP_FLOW_ID_FERFAR=flow_id_from_meta
WHATSAPP_FLOW_ID_PROPERTY=flow_id_from_meta

# ============ PAYMENT GATEWAY ============
RAZORPAY_KEY_ID=key_from_razorpay
RAZORPAY_KEY_SECRET=secret_from_razorpay

# ============ DATABASE ============
DATA_DIR=./data
```

---

## 6. TESTING THE SETUP

### Step 1: Verify webhook is connected
```bash
# Should see in terminal:
# "Webhook verification attempt:"
# "Webhook verified successfully!"
```

### Step 2: Send test message from WhatsApp
1. Open WhatsApp on your phone
2. Message your bot's phone number with: `hi`
3. Check terminal - should see:
   ```
   RAW WEBHOOK RECEIVED: { entry: [ ... ] }
   From: 919876543210
   Type: text
   Text content: hi
   ```

### Step 3: Check if message sends back
Look for in terminal:
```
=== SENDING WHATSAPP MESSAGE ===
To: 919876543210
Message Type: text
API URL: https://graph.facebook.com/v22.0/945940578601053/messages
```

---

## 7. COMMON ISSUES & FIXES

### Issue: "Missing environment variables" warning
**Solution:** Add the missing variables to `.env` file and restart the server

### Issue: "Webhook verification failed - token mismatch"
**Solution:** 
- Make sure VERIFY_TOKEN in .env matches exactly what's in Meta Dashboard
- Check for extra spaces or quotes

### Issue: "WhatsApp API Error: 401 Unauthorized"
**Solution:**
- Access token is invalid or expired
- Get a new permanent token from Meta Business Suite
- Temporary tokens expire after a few hours

### Issue: "WhatsApp API Error: 400 Bad Request"
**Solution:**
- Phone number ID might be wrong
- Phone number format might be wrong (should include country code, e.g., 919876543210)
- Message payload might be malformed

### Issue: "Message received but no response sent"
**Solution:**
- Check if WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID are set
- Terminal should show "Cannot send - Missing real WhatsApp credentials" if not set
- Verify credentials are correct and don't contain "test" in the token

---

## 8. QUICK CHECKLIST

Before you test, verify you have:

- [ ] WHATSAPP_ACCESS_TOKEN (from Meta Business Suite)
- [ ] WHATSAPP_PHONE_NUMBER_ID (NOT the phone number, the ID)
- [ ] VERIFY_TOKEN (create your own random string)
- [ ] ngrok running and URL copied
- [ ] Meta Dashboard webhook URL updated with ngrok URL + /webhook
- [ ] Meta Dashboard webhook VERIFY_TOKEN matches .env
- [ ] Messages subscribed in webhook settings
- [ ] Statuses subscribed in webhook settings
- [ ] Node server running: `npm run dev`
- [ ] Test message sent: type "hi" to bot's WhatsApp number

---

## 9. FLOW DIAGRAM

```
Your Phone
    |
    | Message: "hi"
    v
WhatsApp App
    |
    | HTTPS (secure)
    v
Meta WhatsApp Server
    |
    | Webhook POST to ngrok
    v
ngrok tunnel
    |
    v
Your Backend (localhost:3000/webhook)
    |
    | Process message
    v
messageController.handleMessage()
    |
    v
whatsappService.sendMessage()
    |
    | API call with credentials
    v
Meta WhatsApp API
(https://graph.facebook.com/v22.0/{phone_number_id}/messages)
    |
    | Authenticate with access token
    v
Meta WhatsApp Server
    |
    v
WhatsApp App
    |
    v
Your Phone - RECEIVES RESPONSE ✅
```

---

## 10. IMPORTANT SECURITY NOTES

🔒 **NEVER:**
- Commit `.env` to git
- Share your access token
- Use placeholder values in production
- Share VERIFY_TOKEN publicly

✅ **DO:**
- Use `.env` file for all secrets
- Add `.env` to `.gitignore`
- Rotate tokens regularly in production
- Use permanent tokens for production (not temporary)

---

## Next Steps

1. Gather all credentials from Meta Business Suite
2. Create `.env` file based on template above
3. Start the bot: `npm run dev`
4. Configure webhook in Meta Dashboard
5. Send "hi" to your bot's WhatsApp number
6. Check terminal for successful message processing
7. See response in WhatsApp! ✅

**Questions?** Check the detailed comments in each file - they explain the complete flow!
