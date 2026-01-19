# Getting Started - WhatsApp Bot Setup

## 5-Minute Quick Start

### Step 1: Install (1 min)
```bash
npm install
```

### Step 2: Setup Environment (1 min)
```bash
cp .env.example .env
# Edit .env - add your WhatsApp credentials
```

### Step 3: Start Server (1 min)
```bash
npm run dev
# Server runs on http://localhost:3000
```

### Step 4: Setup ngrok (1 min)
```bash
# In new terminal
ngrok http 3000
# Copy HTTPS URL
```

### Step 5: Configure Webhook (1 min)
- Go to: https://developers.facebook.com
- Select your WhatsApp app
- Webhook URL: `https://your-ngrok-url.ngrok.io/webhook`
- Verify Token: Same as in `.env`
- Save

## Done! 

Send "hi" to your WhatsApp Business number and the bot responds! 🎉

---

## What Happens Next?

1. **User sends "hi"**
   ```
   Bot responds with welcome + 4 service buttons
   ```

2. **User clicks service button**
   ```
   WhatsApp form opens
   ```

3. **User fills & submits form**
   ```
   Bot creates order automatically
   ```

4. **Bot sends payment link**
   ```
   User clicks to pay
   ```

5. **Payment confirmed**
   ```
   Bot sends confirmation on WhatsApp
   ```

---

## Need Help?

- **Quick setup issues?** → See `QUICKSTART.md`
- **Integration issues?** → See `INTEGRATION_GUIDE.md`
- **Full docs?** → See `README.md`
- **Project overview?** → See `PROJECT_SUMMARY.md`

---

## What You Get

✅ Complete WhatsApp bot with forms
✅ Automatic order creation
✅ Payment gateway ready
✅ Session management
✅ Test utilities included
✅ Production-ready code
✅ Complete documentation

---

## Key Files

| File | Purpose |
|------|---------|
| `server.js` | Start here |
| `.env.example` | Configuration template |
| `src/app.js` | Main app setup |
| `src/controllers/message.controller.js` | Message handling |
| `src/services/whatsapp.service.js` | WhatsApp API |
| `src/services/database.service.js` | Data storage |

---

Happy building! 🚀
