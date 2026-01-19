# Complete Integration Guide - WhatsApp Bot with ngrok

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    WhatsApp User                             │
│                  (sends "hi" message)                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
         ┌──────────────────────────┐
         │   WhatsApp Cloud API     │
         │   (Meta/Facebook)        │
         └──────────────┬───────────┘
                        │
                        ↓ (sends webhook)
         ┌──────────────────────────┐
         │    ngrok tunnel          │
         │  https://abc123.ngrok.io │
         └──────────────┬───────────┘
                        │
                        ↓ (forwards to)
    ┌────────────────────────────────────────┐
    │        Your Bot Server                 │
    │  http://localhost:3000/webhook         │
    │                                        │
    │  ┌────────────────────────────────┐   │
    │  │ Webhook Controller             │   │
    │  │ - Verifies token               │   │
    │  │ - Routes messages              │   │
    │  │ - Handles flow completion      │   │
    │  └────────────────┬───────────────┘   │
    │                   │                    │
    │    ┌──────────────┼──────────────┐    │
    │    ↓              ↓              ↓    │
    │ ┌──────┐  ┌──────────┐  ┌──────────┐ │
    │ │Text  │  │Interactive│ │Flow      │ │
    │ │Msg   │  │Button    │ │Complete  │ │
    │ └───┬──┘  └────┬─────┘  └────┬─────┘ │
    │     │         │              │        │
    │     └─────────┼──────────────┘        │
    │               ↓                       │
    │  ┌────────────────────────────────┐   │
    │  │ Message Controller             │   │
    │  │ - Detects service selection    │   │
    │  │ - Triggers WhatsApp Flow       │   │
    │  │ - Creates orders               │   │
    │  │ - Handles flow completions     │   │
    │  └────────────────┬───────────────┘   │
    │                   │                    │
    │         ┌─────────┴─────────┐          │
    │         ↓                   ↓          │
    │  ┌────────────┐      ┌─────────────┐  │
    │  │WhatsApp    │      │Payment      │  │
    │  │Service     │      │Controller   │  │
    │  │ - Sends    │      │ - Processes │  │
    │  │   messages │      │   payments  │  │
    │  │ - Buttons  │      │ - Callbacks │  │
    │  │ - Links    │      │ - Confirms  │  │
    │  └────────────┘      └─────────────┘  │
    │         │                   │          │
    │         └─────────┬─────────┘          │
    │                   ↓                    │
    │  ┌────────────────────────────────┐   │
    │  │ Database Service (JSON)        │   │
    │  │ - Stores users                 │   │
    │  │ - Stores orders                │   │
    │  │ - Stores sessions              │   │
    │  └────────────────────────────────┘   │
    │                                        │
    └────────────────────────────────────────┘
```

## Step-by-Step Integration

### Phase 1: Local Setup

#### 1.1 Clone and Install
```bash
git clone your-repo
cd whatsapp-bot
npm install
```

#### 1.2 Configure Environment
```bash
cp .env.example .env

# Edit .env with:
WHATSAPP_ACCESS_TOKEN=your_meta_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_account_id
VERIFY_TOKEN=secure_random_token_12345
WHATSAPP_FLOW_ID_8A=your_flow_id
WHATSAPP_FLOW_ID_712=your_flow_id
WHATSAPP_FLOW_ID_FERFAR=your_flow_id
WHATSAPP_FLOW_ID_PROPERTY=your_flow_id
BASE_URL=http://localhost:3000
```

#### 1.3 Start Server
```bash
npm run dev
# Server running on http://localhost:3000
```

### Phase 2: Create WhatsApp Flows

1. Go to [Meta Business Dashboard](https://business.facebook.com)
2. Select your WhatsApp App
3. Navigate to: Flows
4. Create 4 new flows:

**Flow 1: 8A Form**
- Fields: Name, Email, State, District, Village, Survey Number
- Success message: Form submitted successfully
- Get Flow ID

**Flow 2: 7/12 Form**
- Same fields
- Get Flow ID

**Flow 3: Ferfar**
- Same fields
- Get Flow ID

**Flow 4: Property Card**
- Same fields
- Get Flow ID

5. Add all Flow IDs to `.env`

### Phase 3: Configure ngrok Tunnel

#### 3.1 Install ngrok
```bash
# macOS
brew install ngrok

# Windows
# Download from https://ngrok.com/download

# Linux
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list && sudo apt update && sudo apt install ngrok
```

#### 3.2 Authenticate ngrok
```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

#### 3.3 Start Tunnel
```bash
ngrok http 3000
# Copy HTTPS URL: https://abc123def.ngrok.io
```

### Phase 4: Configure Webhook in Meta Dashboard

1. Go to [Meta Dashboard](https://developers.facebook.com)
2. Select your WhatsApp app
3. Navigate to: Configuration → Webhooks
4. Click "Edit Webhook"
5. Set:
   - **Webhook URL**: `https://your-ngrok-url.ngrok.io/webhook`
   - **Verify Token**: Same as `VERIFY_TOKEN` in `.env`
6. Click "Verify and Save"

### Phase 5: Subscribe to Events

1. Still in Configuration → Webhooks
2. Click "Manage subscriptions"
3. Subscribe to:
   - `messages`
   - `message_statuses`
   - `message_template_status_update`
4. Save

### Phase 6: Add Test Numbers

1. Go to: Test Numbers
2. Add your WhatsApp Business number
3. Send a test message

## Complete Flow Walkthrough

### Step 1: User Sends "hi"
```
User WhatsApp: "hi"
↓
Server receives webhook with message
Webhook Controller parses message
Identifies "hi" trigger
Calls Message Controller.handleMessage()
```

### Step 2: Welcome Message Sent
```
Message Controller checks session
Session not found → creates new session
Calls whatsappService.sendMessage()
Sends welcome template with 4 buttons
User sees: "Welcome to Land Record Services"
            [8A Form] [7/12 Form] [Ferfar] [Property Card]
```

### Step 3: User Clicks Button
```
User clicks "8A Form"
WhatsApp sends interactive message to webhook
Message contains: button reply ID = "8a_service"
Server receives webhook
Identifies button reply
Calls Message Controller.triggerServiceFlow()
Builds WhatsApp Flow message
Sends flow to user
```

### Step 4: User Completes Form
```
User fills form in WhatsApp
- Name: John Doe
- Email: john@example.com
- State: Maharashtra
- District: Mumbai
- Village: Andheri
- Survey No: 123
↓
User clicks "Submit"
WhatsApp sends nfm_reply with form data
Server webhook receives it
Identifies it as flow completion
Parses form data
Calls Message Controller.handleFlowCompletion()
```

### Step 5: Order Created & Payment Initiated
```
Message Controller.handleFlowCompletion()
Creates order in database:
{
  orderId: "ORD1705315200000",
  whatsappId: "919999999999",
  serviceType: "8A Form",
  userData: { name, email, state, district, village, survey },
  amount: 500,
  status: "pending",
  paymentStatus: "pending"
}
↓
Updates session:
{
  step: "awaiting_payment",
  orderId: "ORD1705315200000"
}
↓
Sends text: "Thank you for filling the form!"
Sends payment link message with button
```

### Step 6: User Makes Payment
```
User clicks payment link
Navigates to: /payment/checkout?orderId=ORD...
Server returns checkout page with test payment form
User submits form (test mode)
Redirects to: /payment/success?orderId=ORD...&mock=true
```

### Step 7: Payment Success Handled
```
Payment Controller.handleSuccess()
Finds order in database
Updates order:
{
  status: "completed",
  paymentStatus: "captured",
  paymentId: "payment_xyz",
  completedAt: timestamp
}
↓
Updates session:
{
  step: "completed",
  completedAt: timestamp
}
↓
Calls whatsappService.sendTextMessage()
Sends confirmation: "✅ Payment Successful!"
Shows order details
```

### Step 8: Confirmation Received
```
User receives on WhatsApp:
"✅ Payment Successful!
Order ID: ORD1705315200000
Service: 8A Form
Amount: ₹500
Date: 15/01/2024

Your application has been received. 
We'll process it within 24 hours."
```

## Testing the Integration

### Test 1: Verify Bot Responds
```bash
# Send via WhatsApp: "hi"
# Check server logs:
# [v0] User sent: hi
# [v0] Sent welcome message with buttons
```

### Test 2: View Data
```bash
curl http://localhost:3000/test/data
```

Returns:
```json
{
  "users": [...],
  "orders": [...],
  "sessions": [...],
  "stats": {
    "totalUsers": 1,
    "totalOrders": 0,
    "totalSessions": 1
  }
}
```

### Test 3: Complete Flow
1. Send "hi"
2. Click "8A Form"
3. Fill WhatsApp form
4. Submit form
5. Check `/test/data` for order
6. Click payment link
7. Complete payment
8. Check WhatsApp for confirmation

## Troubleshooting Integration

### Webhook Not Verifying
```
Error: Webhook verification failed

Solution:
1. Check VERIFY_TOKEN matches exactly
2. Check ngrok URL format (https, not http)
3. Test with curl:
   curl "http://localhost:3000/webhook?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=YOUR_TOKEN"
```

### Messages Not Received
```
Error: No webhook payload received

Solution:
1. Check ngrok is still running
2. Check Phone Number ID is correct
3. Check number is in test list
4. Check webhook subscriptions (messages, statuses)
```

### Flow Not Opening
```
Error: Flow button appears but doesn't open

Solution:
1. Check Flow IDs in .env are correct
2. Ensure flows are published
3. Try on updated WhatsApp app
4. Test with different device
```

### Payment Link Not Working
```
Error: Payment link shows blank page

Solution:
1. Check BASE_URL in .env
2. Ensure ngrok URL matches payment links
3. Check server logs for errors
4. Test direct: /payment/checkout?orderId=TEST123&mock=true
```

## Database Schema

### users.json
```json
{
  "id": "user_123",
  "whatsappId": "919999999999",
  "phoneNumber": "919999999999",
  "lastSeen": "2024-01-15T10:30:00Z",
  "lastMessage": "hi",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### orders.json
```json
{
  "id": "order_123",
  "orderId": "ORD1705315200000",
  "whatsappId": "919999999999",
  "serviceType": "8A Form",
  "userData": {
    "name": "John Doe",
    "email": "john@example.com",
    "state": "Maharashtra",
    "district": "Mumbai",
    "village": "Andheri",
    "surveyNumber": "123"
  },
  "amount": 500,
  "status": "completed",
  "paymentStatus": "captured",
  "paymentId": "pay_123",
  "createdAt": "2024-01-15T10:30:00Z",
  "completedAt": "2024-01-15T10:35:00Z"
}
```

### sessions.json
```json
{
  "id": "session_123",
  "whatsappId": "919999999999",
  "step": "completed",
  "selectedService": "8a_service",
  "serviceName": "8A Form",
  "orderId": "ORD1705315200000",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:35:00Z"
}
```

## Production Checklist

- [ ] Replace JSON database with MongoDB/PostgreSQL
- [ ] Add proper error logging (Winston/Bunyan)
- [ ] Enable HTTPS (remove ngrok)
- [ ] Add rate limiting
- [ ] Add request validation/sanitization
- [ ] Implement proper authentication
- [ ] Add database indexes
- [ ] Setup monitoring and alerts
- [ ] Configure CI/CD pipeline
- [ ] Add unit and integration tests
- [ ] Setup staging environment
- [ ] Configure backup strategy
- [ ] Add security headers
- [ ] Setup log aggregation
- [ ] Configure automatic scaling

## Support

For issues:
1. Check server logs: `npm run dev`
2. Test endpoint: `curl http://localhost:3000/health`
3. View data: `curl http://localhost:3000/test/data`
4. Check .env configuration
5. Verify ngrok tunnel is active
6. Review README.md and QUICKSTART.md
