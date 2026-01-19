# YOUR WHATSAPP CREDENTIALS (From Meta Dashboard Screenshot)

## You Already Have These:

### 1. WHATSAPP_ACCESS_TOKEN
```
EAATkNSRR3NoBQbYAlaxYYrLSZBSUoU5QjtNng2wCcBNl7dfMRtDEZAp3dRnxKaTLaZAYuFc4Pf3K90wLbfiyftH8xyJbhMib1VJ4G1ZBd
```
**Status:** ✓ Already in .env file
**What it does:** Authenticates all API requests to Meta
**Expires:** 60 minutes (need to regenerate from dashboard after)
**Location in screenshot:** Step 1 - "Generate a temporary access token"

---

### 2. WHATSAPP_PHONE_NUMBER_ID
```
945940578601053
```
**Status:** ✓ Already in .env file
**What it does:** Identifies your WhatsApp business account phone
**Location in screenshot:** Step 2 - "Phone number ID:"

---

### 3. WHATSAPP_BUSINESS_ACCOUNT_ID
```
730192466476391
```
**Status:** ✓ Already in .env file
**What it does:** Identifies your business account for billing/management
**Location in screenshot:** Step 2 - "WhatsApp Business Account ID:"

---

### 4. TEST NUMBER (From)
```
+1 555 147 6499
```
**Status:** ✓ Your bot's WhatsApp number
**What it does:** Users will send messages to this number
**Location in screenshot:** Step 2 - "Test number:"

---

### 5. RECIPIENT TEST PHONE NUMBER
```
+91 79872 66831
```
**Status:** ✓ Your personal number for testing
**What it does:** You'll send "hi" to your bot from this number
**Location in screenshot:** Step 3 - "Add a recipient phone number"
**Note:** This is YOU testing the bot

---

## You Need to Create This:

### VERIFY_TOKEN
**Status:** ⚠ You need to create this
**What it does:** Secret token to verify webhook is legitimate
**Rules:** 
- Any random string you want
- Minimum 10 characters recommended
- Must match in BOTH places:
  1. Your .env file ← Already has placeholder
  2. Meta Dashboard → Configuration ← You need to set it

**Example tokens you could use:**
```
my_secret_verify_token_123456
whatsapp_bot_verify_token_v1
super_secret_token_xyz789
verification_token_for_bot
any_random_string_you_like_123
```

**Current placeholder in .env:**
```
VERIFY_TOKEN=your_super_secret_verify_token_change_this_to_random
```

**TODO: Change this to a real token!**

---

## What About ngrok?

When you run `ngrok http 3000`, it gives you a URL like:
```
https://abc123def456.ngrok.io
```

This URL:
- Changes every time you restart ngrok (free tier)
- Is temporary (good for 8 hours)
- Needs to be configured in Meta Dashboard each time it changes

**Your complete webhook URL will be:**
```
https://abc123def456.ngrok.io/webhook
```

---

## Check Your .env File

Your `.env` file should currently have:

```env
# From Meta Dashboard
WHATSAPP_ACCESS_TOKEN=EAATkNSRR3NoBQbYAlaxYYrLSZBSUoU5QjtNng2wCcBNl7dfMRtDEZAp3dRnxKaTLaZAYuFc4Pf3K90wLbfiyftH8xyJbhMib1VJ4G1ZBd
WHATSAPP_PHONE_NUMBER_ID=945940578601053
WHATSAPP_BUSINESS_ACCOUNT_ID=730192466476391

# You need to change this
VERIFY_TOKEN=your_super_secret_verify_token_change_this_to_random

# From ngrok (update after each restart)
NGROK_URL=https://your-ngrok-url.ngrok.io
```

---

## Next Steps

1. **Change VERIFY_TOKEN** to something secure
2. **Run `npm run dev`** to start bot
3. **Run `ngrok http 3000`** in new terminal
4. **Copy ngrok URL** and update NGROK_URL in .env
5. **Go to Meta Dashboard → Configuration**
6. **Set:**
   - Callback URL: `https://your-ngrok-url/webhook`
   - Verify Token: (your new VERIFY_TOKEN)
7. **Click "Verify and Save"**
8. **Send "hi" on WhatsApp**
9. **Bot responds!** ✓

---

## Important Reminders

- VERIFY_TOKEN must match in BOTH places (Meta + .env)
- Access token expires after 60 minutes - need to regenerate
- ngrok URL changes when you restart - need to update Meta each time
- Keep all tokens secret - never share or commit to git
- The test phone numbers are for testing only - go live separately

---

## Reference

| Item | Value | Where From |
|------|-------|-----------|
| Access Token | `EAATkNSRR...` | Meta → API Testing |
| Phone Number ID | `945940578601053` | Meta → API Testing |
| Business Account ID | `730192466476391` | Meta → API Testing |
| Your Bot's Number | `+1 555 147 6499` | Meta → API Testing |
| Your Test Number | `+91 79872 66831` | Your WhatsApp |
| Verify Token | **(You create)** | Set both in .env + Meta Dashboard |
| ngrok URL | `https://abc123...` | Run: `ngrok http 3000` |

All set! Follow `START_HERE_NOW.md` to complete setup.
