# SendGrid Event Webhook Setup Guide

This guide explains how to configure SendGrid's Event Webhook to enable real-time tracking of email opens, clicks, bounces, and other events for FAGOR campaigns.

## What is the Event Webhook?

SendGrid's Event Webhook sends HTTP POST requests to your application whenever email events occur (opens, clicks, bounces, etc.). This enables real-time tracking and analytics.

## Setup Steps

### 1. Get Your Webhook URL

Your webhook endpoint is already configured in the application at:

```
https://your-domain.railway.app/api/webhooks/sendgrid
```

**For local development:**
```
https://3000-yourpreview.manusvm.computer/api/webhooks/sendgrid
```

**For Railway production:**
```
https://ivy-ai-platform-production.up.railway.app/api/webhooks/sendgrid
```

### 2. Configure in SendGrid Dashboard

1. Log in to [SendGrid Dashboard](https://app.sendgrid.com)
2. Navigate to **Settings** → **Mail Settings** → **Event Webhook**
3. Click **Enable Event Webhook**
4. Enter your webhook URL (from step 1)
5. Select the events you want to track:
   - ✅ **Delivered** - Email successfully delivered
   - ✅ **Open** - Recipient opened the email
   - ✅ **Click** - Recipient clicked a link
   - ✅ **Bounce** - Email bounced
   - ✅ **Dropped** - Email was dropped
   - ✅ **Spam Report** - Recipient marked as spam
   - ✅ **Unsubscribe** - Recipient unsubscribed
6. Set **HTTP POST URL** to your webhook URL
7. **OAuth** - Leave disabled (not needed)
8. **Signature Verification** - Optional (recommended for production)
9. Click **Save**

### 3. Test the Webhook

SendGrid provides a "Test Your Integration" button in the Event Webhook settings:

1. Click **Test Your Integration**
2. SendGrid will send sample events to your webhook
3. Check your application logs to verify events are being received

### 4. Verify Events are Being Tracked

After sending test emails:

1. Send a test FAGOR campaign email
2. Open the email
3. Click a link in the email
4. Check the FAGOR Campaign dashboard at `/fagor-campaign`
5. Verify that opens and clicks are being tracked

## Webhook Payload Format

SendGrid sends events as JSON arrays in the request body:

```json
[
  {
    "email": "recipient@example.com",
    "timestamp": 1643723400,
    "event": "open",
    "sg_message_id": "abc123...",
    "useragent": "Mozilla/5.0...",
    "ip": "192.168.1.1"
  },
  {
    "email": "recipient@example.com",
    "timestamp": 1643723450,
    "event": "click",
    "sg_message_id": "abc123...",
    "url": "https://www.fagor-automation.com/training"
  }
]
```

## Supported Events

Our webhook handler processes the following events:

| Event | Description | Tracked in DB |
|-------|-------------|---------------|
| `delivered` | Email successfully delivered | ✅ Yes |
| `open` | Recipient opened email | ✅ Yes |
| `click` | Recipient clicked a link | ✅ Yes (with URL) |
| `bounce` | Email bounced | ✅ Yes |
| `dropped` | Email was dropped | ✅ Yes |
| `spamreport` | Marked as spam | ✅ Yes |
| `unsubscribe` | Recipient unsubscribed | ✅ Yes |

## Troubleshooting

### Webhook Not Receiving Events

1. **Check URL is correct** - Verify the webhook URL in SendGrid matches your application URL
2. **Check firewall** - Ensure your server allows incoming POST requests from SendGrid IPs
3. **Check logs** - Look for webhook errors in application logs
4. **Test with SendGrid's test button** - Use the "Test Your Integration" feature

### Events Not Showing in Dashboard

1. **Check database** - Verify events are being saved to `fagorEmailEvents` table
2. **Check message ID** - Ensure emails are sent with tracking enabled
3. **Check campaign name** - Verify the campaign name matches between sent emails and webhook events

### High Latency

- SendGrid typically delivers webhook events within 1-5 seconds
- If experiencing delays, check SendGrid's status page
- Consider implementing a queue system for high-volume campaigns

## Security Best Practices

### 1. Signature Verification (Recommended for Production)

Enable signature verification in SendGrid:

1. In SendGrid dashboard, enable "Signature Verification"
2. Copy the verification key
3. Add to your environment variables:
   ```
   SENDGRID_WEBHOOK_VERIFICATION_KEY=your_key_here
   ```
4. Update webhook handler to verify signatures

### 2. IP Whitelisting

Restrict webhook endpoint to SendGrid IPs only:

```
SendGrid IP ranges (as of 2024):
- 167.89.0.0/17
- 168.245.0.0/16
- 173.193.128.0/18
- 174.36.92.0/22
- And others - check SendGrid docs for full list
```

### 3. Rate Limiting

Implement rate limiting to prevent abuse:

```typescript
// Example: Max 1000 requests per minute
app.use('/api/webhooks/sendgrid', rateLimit({
  windowMs: 60 * 1000,
  max: 1000
}));
```

## Monitoring

### Check Webhook Health

SendGrid provides webhook statistics:

1. Go to **Settings** → **Mail Settings** → **Event Webhook**
2. View **Event Webhook Statistics**
3. Monitor:
   - Total events sent
   - Failed deliveries
   - Response times

### Application Monitoring

Monitor your webhook endpoint:

```sql
-- Check recent webhook events
SELECT 
  eventType,
  COUNT(*) as count,
  MAX(createdAt) as last_event
FROM fagorEmailEvents
WHERE createdAt > DATE_SUB(NOW(), INTERVAL 1 HOUR)
GROUP BY eventType;
```

## Advanced Configuration

### Custom Event Data

You can include custom data in emails that will be passed through to webhook events:

```typescript
await sendEmail({
  to: 'recipient@example.com',
  from: 'service@fagor-automation.com',
  subject: 'Test Email',
  html: '<p>Content</p>',
  customArgs: {
    campaignId: '123',
    agentId: 'ivy-prospect',
    leadId: '456'
  }
});
```

This custom data will be included in webhook events as `customArgs`.

### Batch Processing

For high-volume campaigns, consider batch processing webhook events:

1. Store events in a queue (Redis, RabbitMQ)
2. Process in batches every 5-10 seconds
3. Update database in bulk operations

## Support

For issues with SendGrid webhook configuration:
- SendGrid Documentation: https://docs.sendgrid.com/for-developers/tracking-events/event
- SendGrid Support: https://support.sendgrid.com

For issues with the Ivy.AI webhook handler:
- Check application logs
- Review webhook handler code in `server/webhooks/sendgrid-webhook.ts`
- Contact Ivy.AI support
