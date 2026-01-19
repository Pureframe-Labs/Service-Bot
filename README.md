# WhatsApp Land Records Bot

A complete WhatsApp automation bot for land record services with integrated payment gateway. The bot guides users through a streamlined flow: Welcome → Service Selection → WhatsApp Form → Payment → Confirmation.

## Flow Diagram

```
User sends "hi" on WhatsApp
        ↓
Welcome Message + Service Buttons (8A, 7/12, Ferfar, Property Card)
        ↓
User clicks service button
        ↓
WhatsApp Flow opens (form submission)
        ↓
User fills and submits form
        ↓
Order created automatically
        ↓
Payment Gateway link sent
        ↓
User completes payment
        ↓
Payment confirmation on WhatsApp
```

## Setup Instructions

### Prerequisites

- Node.js 14+ installed
- WhatsApp Business Account
- Razorpay account (for payments)
- ngrok for local testing (optional)

### 1. Clone & Install

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```
WHATSAPP_ACCESS_TOKEN=your_token_from_meta_business
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
VERIFY_TOKEN=your_secure_verify_token
WHATSAPP_FLOW_ID_8A=your_flow_id_from_meta
WHATSAPP_FLOW_ID_712=your_flow_id_from_meta
WHATSAPP_FLOW_ID_FERFAR=your_flow_id_from_meta
WHATSAPP_FLOW_ID_PROPERTY=your_flow_id_from_meta
BASE_URL=http://localhost:3000
```

### 3. Running the Server

```bash
# Development mode
npm run dev

# Production mode
node server.js

# Using ngrok for local testing
ngrok http 3000
```

### 4. WhatsApp Webhook Configuration

1. Go to Meta Business Dashboard → Your App → Webhooks
2. Set Webhook URL: `https://your-ngrok-url.ngrok.io/webhook`
3. Set Verify Token: The value you set in `.env` as `VERIFY_TOKEN`
4. Subscribe to message events

### 5. Creating WhatsApp Flows

1. Go to Meta Business Dashboard → WhatsApp → Flows
2. Create 4 flows for: 8A Form, 7/12 Form, Ferfar, Property Card
3. Copy the Flow IDs to your `.env` file
4. Each flow should collect: Name, Email, State, District, Village, Survey Number

## API Endpoints

### Webhook
- `GET /webhook` - Webhook verification
- `POST /webhook` - Receive messages and flow completions

### Payment
- `GET /payment/checkout` - Payment page with test mode
- `GET /payment/success` - Payment success callback
- `GET /payment/failure` - Payment failure callback

### Testing
- `GET /health` - Health check
- `GET /test/data` - View all users, orders, sessions
- `POST /test/clear` - Clear all test data (development only)

## File Structure

```
src/
├── app.js                          # Express app setup
├── server.js                       # Entry point
├── config/
│   ├── database.config.js         # DB configuration
│   ├── payment.config.js          # Payment config
│   └── whatsapp.config.js         # WhatsApp config
├── controllers/
│   ├── webhook.controller.js      # Webhook handler
│   ├── message.controller.js      # Message processing
│   ├── payment.controller.js      # Payment handling
│   └── flow.controller.js         # Flow handling
├── services/
│   ├── database.service.js        # Data persistence (JSON)
│   ├── whatsapp.service.js        # WhatsApp API
│   ├── notification.service.js    # Message templates
│   ├── payment.service.js         # Payment logic
│   └── flow.service.js            # Flow management
├── routes/
│   ├── webhook.routes.js          # Webhook routes
│   ├── payment.routes.js          # Payment routes
│   └── test.routes.js             # Test routes
├── templates/
│   ├── welcome.template.js        # Welcome message
│   ├── buttons.template.js        # Button templates
│   └── confirmation.template.js   # Confirmation messages
├── models/
│   ├── user.model.js              # User model
│   └── order.model.js             # Order model
├── utils/
│   ├── logger.js                  # Logging utility
│   ├── validator.js               # Validation
│   └── helpers.js                 # Helper functions
└── data/                          # Local JSON database
    ├── users.json
    ├── orders.json
    └── sessions.json
```

## Testing with Mock Data

The system includes a test mode for payment testing:

1. Visit: `http://localhost:3000/payment/checkout?orderId=TEST123&mock=true`
2. Fill any email and card number
3. Click "Pay Now"
4. You'll see the success page and WhatsApp confirmation will be sent

## Database Structure

The bot uses JSON files for data storage (suitable for testing/small deployments):

### Users
```json
{
  "id": "user_123",
  "whatsappId": "919999999999",
  "phoneNumber": "919999999999",
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Orders
```json
{
  "id": "order_123",
  "orderId": "ORD1705315200000",
  "whatsappId": "919999999999",
  "serviceType": "8A Form",
  "userData": { /* form data */ },
  "amount": 500,
  "status": "pending",
  "paymentStatus": "pending",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Sessions
```json
{
  "id": "session_123",
  "whatsappId": "919999999999",
  "step": "awaiting_flow_completion",
  "selectedService": "8a_service",
  "serviceName": "8A Form",
  "orderId": "ORD1705315200000",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

## Message Flow

### 1. User Initiates
User sends: `hi`

Bot responds with welcome message + 4 service buttons

### 2. Service Selection
User clicks service button (e.g., "8A Form")

Bot triggers WhatsApp Flow

### 3. Form Submission
User fills form in WhatsApp Flow

System receives form data via webhook

### 4. Order Creation
Order created with form data

Session updated to "awaiting_payment"

### 5. Payment
Payment link sent to user

User clicks and completes payment

### 6. Confirmation
Payment verified

Order marked as "completed"

Confirmation message sent to WhatsApp

## Troubleshooting

### Webhook not receiving messages
- Check VERIFY_TOKEN matches in Meta Dashboard
- Ensure ngrok URL is correct in webhook settings
- Check server logs for connection errors

### WhatsApp Flow not opening
- Verify Flow IDs in `.env` are correct
- Check Meta Dashboard → Flows for flow status
- Ensure flows are published and active

### Payment not processing
- Verify payment gateway credentials
- Check test mode is enabled for testing
- Review payment controller logs

### Messages not sending
- Verify WhatsApp Access Token is valid
- Check Phone Number ID is correct
- Ensure phone number is in correct format (with country code)

## Production Deployment

For production:

1. Use a real database (MongoDB, PostgreSQL) instead of JSON
2. Enable HTTPS
3. Add proper authentication
4. Implement rate limiting
5. Add request validation
6. Use environment-specific configurations
7. Monitor webhooks and errors
8. Set up proper logging and alerts

## API Documentation

### Webhook Payload - Message

```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "123456",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "messages": [{
          "from": "919999999999",
          "id": "msg_123",
          "type": "interactive",
          "interactive": {
            "nfm_reply": {
              "response_json": "{...form_data...}"
            }
          }
        }]
      }
    }]
  }]
}
```

### Order Response

```json
{
  "success": true,
  "orderId": "ORD1705315200000",
  "serviceType": "8A Form",
  "amount": 500,
  "paymentLink": "https://your-domain.com/payment/checkout?orderId=ORD1705315200000",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

## Support

For issues or questions:
- Check the troubleshooting section
- Review server logs
- Verify all environment variables
- Test endpoints with provided test routes

## License

MIT

## Contributors

Built with Node.js, Express, and WhatsApp Cloud API
