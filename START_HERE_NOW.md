# START HERE - 5 MINUTE SETUP

Your bot is ready to work! Follow these 5 steps in order.

---

## Step 1: Verify Your .env File

The `.env` file has been created with your credentials from the Meta screenshot.

**Run this to check:**
```bash
npm run dev
```

**What you should see:**
```
✓ All credentials loaded
✓ Webhook endpoint ready
✓ Server running on port 3000
```

**If you see warnings:**
- It means environment variables are missing
- Read `WEBHOOK_VERIFICATION_CHECKLIST.md` for how to fix

---

## Step 2: Start ngrok (Local Testing Only)

In a **NEW terminal window**, run:
```bash
ngrok http 3000
```

**You'll see:**
```
Forwarding    https://abc123def456.ngrok.io -> http://localhost:3000
```

**Copy that HTTPS URL** → You'll need it in Step 3

---

## Step 3: Configure Webhook in Meta Dashboard

1. **Go to Meta Business Dashboard**
2. **Navigate to WhatsApp → Configuration**
3. **Find "Webhook URL configuration"**
4. **Enter:**
   - **Callback URL**: `https://abc123def456.ngrok.io/webhook` (paste your ngrok URL)
   - **Verify Token**: `your_super_secret_verify_token_change_this_to_random` (from your .env)
5. **Click "Verify and Save"**

**Expected result:**
- Green checkmark appears ✓
- Message says "Webhook verified"
- You see in terminal: "Token matches! Webhook verified"

---

## Step 4: Test with WhatsApp

1. **Open WhatsApp on your phone**
2. **Go to your test number** (the one in Meta Dashboard)
3. **Send: `hi`**
4. **Wait 2-3 seconds**

**Expected result:**
```
✓ You receive 4 buttons (8A, 7/12, Ferfar, Property Card)
```

**If nothing happens:**
- Check Step 3 - maybe webhook wasn't verified
- Check terminal for errors
- See `WEBHOOK_VERIFICATION_CHECKLIST.md` for troubleshooting

---

## Step 5: You're Done!

Your bot is now working! Try:
- Click any button
- See the WhatsApp Flow form open
- Fill the form
- See order created
- Get payment link
- Complete payment
- Get confirmation

---

## What's Working Now

| Feature | Status | What It Does |
|---------|--------|--------------|
| Webhook Verification | ✓ | Meta can reach your server |
| Message Reception | ✓ | Bot receives "hi" messages |
| Welcome Message | ✓ | Bot sends 4 buttons |
| Button Clicks | ✓ | Forms open when you click |
| Form Submission | ✓ | Orders created in database |
| Payment Links | ✓ | Payment gateway integration |
| Confirmations | ✓ | Bot sends success message |

---

## For Production Deployment

When you're ready to go live:

1. **Get permanent ngrok URL** (use ngrok pro)
   - Or deploy to Heroku, AWS, Vercel, etc.
   
2. **Get permanent access token** from Meta
   - Current token expires in 60 minutes
   - Go to App Settings → Tokens
   
3. **Update Meta Dashboard** with production URL
   - Replace ngrok URL with your server URL
   
4. **Store credentials securely**
   - Use proper secrets management
   - Never commit .env to git
   - Use environment variables in your host

---

## Need Help?

### "Bot not responding"
→ Read: `WEBHOOK_VERIFICATION_CHECKLIST.md`

### "How does the complete flow work?"
→ Read: `COMPLETE_SETUP_GUIDE.md`

### "How to test with Postman?"
→ Read: `tests/POSTMAN_GUIDE.md`

### "What credentials do I need?"
→ Read: `BACKEND_SETUP_REQUIRED.md`

### "How are functions connected?"
→ Every source file has detailed comments explaining the flow

---

## Quick Reference

**3 Things You Need From Meta:**

```
1. WHATSAPP_ACCESS_TOKEN
   From: API Testing → Generate access token
   Value: EAATkNSRR3NoBQbYAlaxYYrLSZBSUoU5QjtNng2wCcBNl7dfMRtDEZAp3dRnxKaTLaZAYuFc4Pf3K90wLbfiyftH8xyJbhMib1VJ4G1ZBd

2. WHATSAPP_PHONE_NUMBER_ID
   From: API Testing → Phone number ID
   Value: 945940578601053

3. VERIFY_TOKEN
   Create: Any random string you want
   Example: my_secret_token_123456
   Use it in BOTH:
     - .env file
     - Meta Dashboard → Configuration
```

**3 Commands You Need:**

```bash
# Terminal 1: Start bot
npm run dev

# Terminal 2: Start ngrok (new terminal)
ngrok http 3000

# Meta Dashboard: Configure webhook with ngrok URL
# Then test by sending "hi" on WhatsApp!
```

That's it! 🚀
