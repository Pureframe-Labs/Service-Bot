# WhatsApp Webhook Verification Checklist

## The Complete Flow Explained

```
YOUR WHATSAPP BOT FLOW:

User sends "hi"
    ↓
Meta WhatsApp Server receives it
    ↓
Meta sends POST request to your webhook:
    https://your-ngrok-url.ngrok.io/webhook
    ↓
ngrok receives it and forwards to:
    http://localhost:3000/webhook
    ↓
Your Node.js server (server.js) receives it
    ↓
Express routes it to: POST /webhook
    ↓
webhookController.handleWebhook() processes it
    ↓
messageController.handleMessage() detects "hi"
    ↓
whatsappService.sendMessage() sends response via Meta API
    ↓
Meta sends message back to user
    ↓
User receives bot response!
```

## Problem: Messages Not Being Received

If you send "hi" but the bot doesn't respond, it's because one of these steps is breaking.

**Most Common Reasons (in order):**

1. **Webhook not verified** → Meta won't send messages
2. **ngrok URL not configured in Meta** → Messages go nowhere
3. **Environment variables missing** → Backend can't authenticate
4. **Wrong verify token** → Webhook verification fails

---

## Step-by-Step Verification

### STEP 1: Check Environment Variables

Your `.env` file should have these 3 things:

```
WHATSAPP_ACCESS_TOKEN=EAATkNSRR3NoBQbYAlaxYYrLSZBSUoU5QjtNng2wCcBNl7dfMRtDEZAp3dRnxKaTLaZAYuFc4Pf3K90wLbfiyftH8xyJbhMib1VJ4G1ZBd
WHATSAPP_PHONE_NUMBER_ID=945940578601053
VERIFY_TOKEN=your_super_secret_verify_token_change_this_to_random
```

**Where to get them:**

From your Meta Dashboard screenshot:
- **WHATSAPP_ACCESS_TOKEN**: The token shown in step 1 (already provided above)
- **WHATSAPP_PHONE_NUMBER_ID**: 945940578601053 (shown in step 2)
- **VERIFY_TOKEN**: Create any random string (e.g., "my_secret_token_123456")

**To verify:**
```bash
# In your project root, run:
npm run dev

# You should see in the terminal:
# ✓ WHATSAPP_ACCESS_TOKEN loaded
# ✓ WHATSAPP_PHONE_NUMBER_ID loaded
# ✓ VERIFY_TOKEN loaded
# (If any are missing, you'll see a WARNING)
```

---

### STEP 2: Set Up ngrok

**Install ngrok** (if not already installed):
```bash
npm install -g ngrok
```

**Start ngrok**:
```bash
ngrok http 3000
```

**You'll see output like:**
```
ngrok                                          (Ctrl+C to quit)

Session Status                online
Session Expires               1 hour, 59 minutes
Version                       3.0.0
Region                        us (United States)
Latency                       45ms
Web Interface                 http://127.0.0.1:4040

Forwarding                    https://abc123def456.ngrok.io -> http://localhost:3000
```

**Copy the HTTPS URL**: `https://abc123def456.ngrok.io`

**Update your .env**:
```
NGROK_URL=https://abc123def456.ngrok.io
```

---

### STEP 3: Configure Webhook in Meta Dashboard

**Go to Meta Dashboard:**
1. Click on "Configuration" in the left sidebar
2. Scroll down to "Webhook URL configuration"

**Enter these values:**

```
Callback URL: https://abc123def456.ngrok.io/webhook
Verify Token: your_super_secret_verify_token_change_this_to_random
```

(Use the exact same VERIFY_TOKEN from your .env file)

**Click "Verify and Save"**

**What happens:**
- Meta sends a GET request to your webhook
- Your server checks if the token matches
- If it matches, webhook is verified ✓
- If not, you get a 403 error

---

### STEP 4: Check Server Logs

**Terminal Output Should Show:**

When you start the server:
```
[INFO] Bot server starting on port 3000...
[INFO] All required credentials loaded
[INFO] Webhook endpoint ready: /webhook
[INFO] Server running on: http://localhost:3000
```

When Meta verifies the webhook:
```
[INFO] Webhook verification request received
[INFO] Token matches! Webhook verified ✓
```

When user sends a message:
```
[INFO] Webhook POST received
[INFO] Message from: +1234567890
[INFO] Message text: hi
[INFO] Processing message...
[INFO] Sending welcome message with 4 buttons
```

---

### STEP 5: Test It

**Method 1: Use your WhatsApp phone number**
1. Open WhatsApp on your phone
2. Go to the number you configured (your test number)
3. Send "hi"
4. Bot should respond with 4 buttons

**Method 2: Use Postman to simulate**
```
POST https://your-ngrok-url.ngrok.io/webhook

Body (JSON):
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "1234567890",
          "type": "text",
          "text": { "body": "hi" }
        }],
        "metadata": {
          "phone_number_id": "945940578601053"
        }
      }
    }]
  }]
}
```

---

## Troubleshooting

### Problem: "Missing environment variables"

**Solution:**
```bash
# Check your .env file exists
ls -la .env

# Check it has all 3 variables
cat .env | grep WHATSAPP_ACCESS_TOKEN
cat .env | grep WHATSAPP_PHONE_NUMBER_ID
cat .env | grep VERIFY_TOKEN
```

### Problem: "Webhook verification failed"

**Solution:**
1. Make sure ngrok is running: `ngrok http 3000`
2. Check the URL in Meta Dashboard matches your ngrok URL
3. Check VERIFY_TOKEN in .env matches VERIFY_TOKEN in Meta Dashboard
4. Tokens are case-sensitive!

### Problem: "Messages received but bot doesn't respond"

**Solution:**
1. Check WHATSAPP_ACCESS_TOKEN is correct
2. Check WHATSAPP_PHONE_NUMBER_ID is correct
3. Check terminal for errors when sending message
4. Check that you have a recipient phone number added in Meta Dashboard

### Problem: "ngrok URL keeps changing"

**Solution:**
- Free ngrok changes URL every restart
- Either:
  - Reconfigure webhook in Meta each time
  - Use ngrok pro for static URL (paid)
  - Use environment variable and restart script

---

## The Complete Setup Checklist

- [ ] `.env` file exists in project root
- [ ] `WHATSAPP_ACCESS_TOKEN` is filled in
- [ ] `WHATSAPP_PHONE_NUMBER_ID` is filled in
- [ ] `VERIFY_TOKEN` is filled in and matches Meta Dashboard
- [ ] `npm run dev` shows no warnings
- [ ] ngrok is running with `ngrok http 3000`
- [ ] ngrok URL is copied and updated in `.env`
- [ ] Meta Dashboard → Configuration → Callback URL is set
- [ ] Meta Dashboard → Configuration → Verify Token is set
- [ ] Meta Dashboard shows "Webhook verified" (green checkmark)
- [ ] Test phone number is added in Meta Dashboard
- [ ] Webhook listening is turned ON in Meta Dashboard
- [ ] You send "hi" on WhatsApp
- [ ] Terminal shows message received
- [ ] Bot responds with 4 buttons

---

## Quick Debug Command

```bash
# See all your environment variables (sensitive data masked)
grep "WHATSAPP\|VERIFY" .env

# Watch logs in real-time
npm run dev 2>&1 | grep -i "webhook\|message\|error"

# Test webhook from Postman
# Copy the JSON from "POSTMAN_GUIDE.md"
# Replace phone_number_id with: 945940578601053
# Send to: https://your-ngrok-url.ngrok.io/webhook
```

---

## Still Not Working?

1. **Check ngrok is forwarding**: Open http://127.0.0.1:4040 to see request logs
2. **Check Meta is sending**: Look in Meta Dashboard for "Webhook Logs"
3. **Check backend is receiving**: Look in terminal for "[INFO] Webhook POST received"
4. **Check authentication**: Look for "token matches" or "authentication failed" in logs

Everything in the logs will tell you exactly where the break is!
