# Quick Start Guide - WhatsApp Bot with ngrok

## 60-Second Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Copy & Configure .env
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
- `WHATSAPP_ACCESS_TOKEN` - From Meta Business Dashboard
- `WHATSAPP_PHONE_NUMBER_ID` - From WhatsApp Business Account
- `WHATSAPP_BUSINESS_ACCOUNT_ID` - From Meta Business Dashboard
- `VERIFY_TOKEN` - Create any secure string (e.g., "my_secret_token_123")

### Step 3: Start the Server
```bash
npm run dev
```

Server runs on `http://localhost:3000`

### Step 4: Setup ngrok Tunnel
```bash
# In another terminal window
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

### Step 5: Configure Webhook in Meta Dashboard

1. Go to: https://developers.facebook.com
2. Select your WhatsApp app
3. Go to: Configuration → Webhooks
4. Set Webhook URL: `https://your-ngrok-url.ngrok.io/webhook`
5. Set Verify Token: Same as `VERIFY_TOKEN` in `.env`
6. Subscribe to: `messages`, `message_statuses`

### Step 6: Test the Bot

Send `hi` to your WhatsApp Business number.

You should see:
```
Welcome to Land Record Services

Please choose the service:
[8A Form] [7/12 Form] [Ferfar] [Property Card]
```

## User Flow

```
User: "hi"
↓
Bot: Welcome with 4 service buttons
↓
User: Clicks "8A Form"
↓
Bot: Opens WhatsApp Flow form
↓
User: Fills form (name, email, location, etc.)
↓
Bot: Creates order, sends payment link
↓
User: Clicks payment link, completes payment
↓
Bot: Sends confirmation message
```

## Testing

### View All Data
```bash
curl http://localhost:3000/test/data
```

### Clear Test Data
```bash
curl -X POST http://localhost:3000/test/clear
```

### Health Check
```bash
curl http://localhost:3000/health
```

## Files You Need to Create in Meta Dashboard

1. **WhatsApp Flows** (4 total)
   - Flow 1: 8A Form
   - Flow 2: 7/12 Form
   - Flow 3: Ferfar
   - Flow 4: Property Card

Each flow should collect:
- Name
- Email
- State
- District
- Village/City
- Survey Number

After creating flows, copy their IDs to `.env`:
```
WHATSAPP_FLOW_ID_8A=xxx
WHATSAPP_FLOW_ID_712=xxx
WHATSAPP_FLOW_ID_FERFAR=xxx
WHATSAPP_FLOW_ID_PROPERTY=xxx
```

## Testing Payment Flow

1. Click a service button
2. Fill the WhatsApp form
3. You'll get a payment link
4. Visit: `http://localhost:3000/payment/checkout?orderId=TEST123&mock=true`
5. Click "Pay Now"
6. Check WhatsApp for confirmation

## Troubleshooting

### "Webhook verification failed"
- Check `VERIFY_TOKEN` matches between `.env` and Meta Dashboard
- Make sure ngrok URL is correct

### "Messages not received"
- Verify Phone Number ID is correct
- Check Access Token is valid
- Ensure phone is added to test list in Meta Dashboard

### "Flow not opening"
- Check Flow IDs in `.env` are correct
- Ensure flows are published in Meta Dashboard
- Try on different WhatsApp client (might need app update)

### "Payment link not sending"
- Check `BASE_URL` in `.env`
- Verify ngrok URL matches in payment links

## Endpoints Summary

| Method | URL | Purpose |
|--------|-----|---------|
| GET | `/health` | Health check |
| GET | `/webhook` | Webhook verification |
| POST | `/webhook` | Receive messages |
| GET | `/payment/checkout` | Payment page |
| GET | `/payment/success` | Payment callback |
| GET | `/test/data` | View data (dev) |
| POST | `/test/clear` | Clear data (dev) |

## Next Steps

1. Create WhatsApp Flows in Meta Dashboard
2. Add real payment gateway integration (Razorpay/Stripe)
3. Switch from JSON to real database (MongoDB/PostgreSQL)
4. Add proper logging and monitoring
5. Deploy to production server

## Support

Check `README.md` for detailed documentation.
```

Now let me create a comprehensive testing utility:
