# WhatsApp Configuration & Setup Guide

## Overview
This bot receives messages on your WhatsApp phone number and responds automatically. When a user sends "hi", the bot responds with service options.

## Step 1: Get Your WhatsApp Credentials

### 1.1 Access Meta Business Platform
1. Go to https://developers.facebook.com/
2. Create an app or use existing one
3. Set up WhatsApp product

### 1.2 Find Your Phone Number ID
1. In Meta Business Platform, go to WhatsApp > API Setup
2. Under "Phone Numbers", you'll see your phone number with its ID
3. **Phone Number ID**: This is what goes in `WHATSAPP_PHONE_NUMBER_ID` in .env
   - Example: `945940578601053` (as you provided)

### 1.3 Get Your Access Token
1. Go to System > User Access Tokens (or App > Settings > Basic)
2. Create/copy your permanent access token
3. **Access Token**: This goes in `WHATSAPP_ACCESS_TOKEN` in .env
   - Must start with `EAAB...` or similar

### 1.4 Get Your Business Account ID
1. In Business Settings, find your Business Account ID
2. Goes in `WHATSAPP_BUSINESS_ACCOUNT_ID` in .env

## Step 2: Configure Your .env File

```bash
# Copy the template
cp .env.example .env

# Edit .env and add your credentials:
WHATSAPP_ACCESS_TOKEN=your_actual_token_here
WHATSAPP_PHONE_NUMBER_ID=945940578601053
WHATSAPP_BUSINESS_ACCOUNT_ID=your_actual_id_here
VERIFY_TOKEN=my_super_secret_token_12345
WHATSAPP_API_VERSION=v22.0
```

## Step 3: Configure Webhook in Meta Dashboard

### 3.1 Set Up Webhook URL
1. In Meta App Dashboard > WhatsApp > Configuration
2. Scroll to "Webhook URL"
3. Add your webhook endpoint:
   - For local testing with ngrok:
     ```
     https://your-ngrok-url.ngrok.io/webhook
     ```
   - Example: `https://abc123.ngrok.io/webhook`

### 3.2 Set Verify Token
1. In same webhook configuration, set "Verify Token"
2. Use the value from your `.env` file `VERIFY_TOKEN`
3. Must match exactly!

### 3.3 Select Webhook Fields
Subscribe to:
- `messages` - To receive incoming messages
- `statuses` - To track message delivery

## Step 4: Create WhatsApp Flows (Forms)

The bot sends users to WhatsApp Flows to fill out forms. You need to create 4 flows:

1. **8A Form** - Get Flow ID → `WHATSAPP_FLOW_ID_8A`
2. **7/12 Form** - Get Flow ID → `WHATSAPP_FLOW_ID_712`
3. **Ferfar** - Get Flow ID → `WHATSAPP_FLOW_ID_FERFAR`
4. **Property Card** - Get Flow ID → `WHATSAPP_FLOW_ID_PROPERTY`

Add these IDs to your `.env` file.

## Step 5: Start the Bot

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or use ngrok for local testing
ngrok http 3000

# In another terminal, start the bot
npm run dev
```

## Step 6: Test the Bot

1. **Send "hi" to your WhatsApp number**
   - The bot should respond with welcome message and 4 service buttons

2. **Click on a service button**
   - A WhatsApp Flow should open
   - Fill the form and submit

3. **After form submission**
   - Order is created
   - Payment link is sent to WhatsApp

4. **Complete payment**
   - Confirmation message appears on WhatsApp

## Troubleshooting

### Issue: "Missing WhatsApp credentials"
- Check `.env` file has valid `WHATSAPP_ACCESS_TOKEN`
- Check it's not the placeholder text from `.env.example`
- Token should be long (100+ characters)

### Issue: Webhook not connecting
- Verify ngrok is running and URL is updated in Meta Dashboard
- Webhook URL must be HTTPS (ngrok provides this)
- Check VERIFY_TOKEN matches exactly

### Issue: Messages not sending
- Token might be expired - get new one from Meta Dashboard
- Phone Number ID might be incorrect
- Check API version is `v22.0`

### Issue: Webhook keeps failing
- Check server is running (`npm run dev`)
- Check logs for specific errors
- Ensure port 3000 is not in use

## Phone Number ID Reference

Your phone number ID is: **945940578601053**

Add to `.env`:
```
WHATSAPP_PHONE_NUMBER_ID=945940578601053
```

This ID receives all messages users send to your WhatsApp number.

## API Endpoint Used

The bot sends messages to:
```
https://graph.facebook.com/v22.0/{WHATSAPP_PHONE_NUMBER_ID}/messages
```

With your ID, it's:
```
https://graph.facebook.com/v22.0/945940578601053/messages
```

This is automatically handled by the `whatsapp.service.js` file.
