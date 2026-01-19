# WhatsApp Bot - Postman Test Collection Guide

## Overview
Complete Postman collection for testing all WhatsApp Bot API endpoints including webhook verification, message handling, flow completion, and payment callbacks.

## Quick Start

### 1. Import Collection
- Open Postman
- Click **Import** button
- Select file: `tests/postman-collection.json`
- Collection "WhatsApp Bot API - Complete Test Collection" will be imported

### 2. Set Environment Variables
Click the environment dropdown and configure these variables:

| Variable | Value | Example |
|----------|-------|---------|
| `base_url` | Your local/ngrok URL | `http://localhost:3000` or `https://abc-123.ngrok.io` |
| `verify_token` | Token from .env | `your_verify_token_here` |
| `phone_number_id` | WhatsApp phone ID | `12345` |
| `business_account_id` | Meta business account ID | `123456789` |
| `display_phone_number` | Your bot's WhatsApp number | `+1234567890` |
| `user_phone` | Test user's phone (without +) | `919876543210` |
| `order_id` | Order ID for testing | `ORDER_123456` |

### 3. Run Tests

#### Single Request
1. Click any request in the collection
2. Click **Send**
3. Check response and test results

#### Run Full Collection
1. Click the collection name
2. Click **Run**
3. Select requests to run
4. Click **Run WhatsApp Bot API**
5. View results in Collection Runner

## Test Endpoints

### Webhook Tests

#### Verify Webhook
- **Endpoint**: `GET /webhook`
- **Purpose**: Meta's verification request
- **Parameters**:
  - `hub.mode=subscribe`
  - `hub.challenge=<token>`
  - `hub.verify_token=<token>`
- **Expected**: Returns challenge token
- **Tests**: Status 200, contains challenge, response time < 2s

#### Simulate User Message 'hi'
- **Endpoint**: `POST /webhook`
- **Purpose**: Send test message "hi"
- **Body**: WhatsApp webhook payload
- **Expected**: 200 response, welcome message triggered
- **Tests**: Status 200, valid JSON response

#### Simulate Button Click - 8A
- **Endpoint**: `POST /webhook`
- **Purpose**: Test interactive button click
- **Body**: Button reply payload
- **Expected**: Flow triggered, user sees form
- **Tests**: Status 200, quick response time

#### Simulate Flow Completion
- **Endpoint**: `POST /webhook`
- **Purpose**: Test form submission via WhatsApp Flow
- **Body**: Form data from flow
- **Expected**: Order created, payment link sent
- **Tests**: Status 200, order created

### Payment Tests

#### Payment Success Callback
- **Endpoint**: `GET /payment/success`
- **Purpose**: Handle successful payment
- **Parameters**:
  - `orderId` - Order ID
  - `paymentId` - Payment ID
  - `email` - Customer email
  - `mock=true` - Test mode
- **Expected**: Order updated, confirmation sent
- **Tests**: Status 200, contains "success"

#### Payment Failure Callback
- **Endpoint**: `GET /payment/failure`
- **Purpose**: Handle payment failure
- **Parameters**:
  - `orderId` - Order ID
  - `reason` - Failure reason
- **Expected**: Order status updated to failed
- **Tests**: Status 200, contains "failure"

#### Checkout Page
- **Endpoint**: `GET /payment/checkout`
- **Purpose**: Get payment checkout page
- **Parameters**:
  - `orderId` - Order ID
- **Expected**: HTML checkout page
- **Tests**: Status 200, contains "Secure Checkout"

## Testing Flow

### Complete User Journey Test

Run tests in this order:

1. **Verify Webhook** - Ensure webhook is properly configured
2. **Simulate User Message** - User sends "hi"
3. **Simulate Button Click** - User clicks "8A" button
4. **Simulate Flow Completion** - User fills and submits form
5. **Payment Success Callback** - User completes payment

### Expected Flow

```
User sends "hi" → Bot sends welcome with 4 buttons
User clicks button → WhatsApp Flow opens
User fills form → Form data submitted
Order created → Payment link sent
User completes payment → Payment success callback
Confirmation sent to user ✓
```

## Debugging Tips

### View Response Body
- Click **Body** tab in response
- Check JSON structure and data

### View Response Headers
- Click **Headers** tab
- Verify Content-Type and other headers

### Check Test Results
- Click **Test Results** tab
- See which assertions passed/failed

### Enable Console
- In Postman: View → Show Postman Console
- See request/response logs and errors

## Common Issues & Solutions

### Status 401/403
- Check `verify_token` is correct
- Verify environment variables are set

### Challenge Token Not Returned
- Ensure `hub.challenge` parameter matches exactly
- Check webhook URL in Meta Dashboard

### Flow Not Triggering
- Verify `phone_number_id` is correct
- Check flow IDs in Meta Dashboard
- Ensure flow is published

### Order Not Created
- Check database file exists (data.json)
- Verify flow response JSON is valid
- Check console logs for errors

### Payment Not Processing
- Enable mock mode for testing
- Check `order_id` parameter format
- Verify payment URLs are correct

## ngrok Testing

When using ngrok for local testing:

1. Start ngrok:
   ```bash
   ngrok http 3000
   ```

2. Copy ngrok URL (e.g., `https://abc-123.ngrok.io`)

3. Set in Postman:
   - `base_url` = `https://abc-123.ngrok.io`

4. Update Meta Dashboard:
   - Webhook URL: `https://abc-123.ngrok.io/webhook`
   - Verify Token: Same as `.env`

5. Test all requests

## Collection Structure

```
WhatsApp Bot API Collection
├── Webhook
│   ├── Verify Webhook
│   ├── Simulate User Message - 'hi'
│   ├── Simulate Interactive Button Click - 8A
│   └── Simulate Flow Completion
└── Payment
    ├── Payment Success Callback
    ├── Payment Failure Callback
    └── Payment Checkout Page
```

## Advanced Testing

### Create Custom Test
1. Click request → **Tests** tab
2. Add custom JavaScript assertions
3. Example:
   ```javascript
   pm.test('Order ID matches', function () {
       const jsonData = pm.response.json();
       pm.expect(jsonData.orderId).to.equal(pm.variables.get('order_id'));
   });
   ```

### Use Pre-request Scripts
1. Click request → **Pre-request Script** tab
2. Set variables dynamically
3. Example:
   ```javascript
   pm.variables.set('order_id', 'ORDER_' + Date.now());
   ```

### Run with Different Variables
1. Create multiple environments
2. Switch between them
3. Run same collection against different configs

## Support

For issues or questions:
1. Check console logs in Postman
2. Verify all variables are set
3. Check server logs: `npm run dev`
4. Review error messages in response body
