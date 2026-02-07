# Bulk Email Confirmation Guide

## Overview

The Bulk Email feature allows admins to retroactively send confirmation emails to orders that didn't receive them. This is perfect for:
- Orders placed before the email system was enabled
- Orders that failed to send emails due to configuration issues
- Recovering from email provider outages
- Manually triggering emails for specific orders

## How to Access

1. Navigate to **Admin Dashboard** → **Email Logs** (from the header dropdown)
2. Click the **"Bulk Send"** tab

## Features

### 1. Automatic Detection
The system automatically finds all orders that:
- Have status: `paid`, `confirmed`, or `completed`
- Don't have a corresponding email log entry
- Haven't received a confirmation email

### 2. Order Selection
- **Select Individual Orders**: Click checkboxes next to specific orders
- **Select All**: Use the checkbox in the table header
- **View Order Details**: See order ID, customer, amount, items, event, date, and status

### 3. Bulk Sending
- Click **"Send X Emails"** button (where X is the number selected)
- Confirmation dialog appears
- Progress bar shows sending status
- Results displayed after completion

### 4. Results Tracking
After sending, you'll see:
- ✅ **Successful sends**: Orders that received emails
- ❌ **Failed sends**: Orders with errors (includes error messages)
- Summary: Total, successful, and failed counts

### 5. Rate Limiting
- Emails are sent with a 100ms delay between each
- This prevents rate limiting issues with email providers
- For 100 orders, expect ~10 seconds to complete

## Best Practices

### Before Sending
1. **Enable Email Notifications**: Go to `/admin/settings` and ensure emails are enabled
2. **Configure Provider**: Set up either SMTP or Resend API
3. **Test First**: Send a test email to yourself to verify configuration
4. **Check Orders**: Review the list to ensure you're sending to the right customers

### During Sending
- **Don't close the page**: Let the process complete
- **Watch the progress bar**: It will show completion percentage
- **Monitor for errors**: Check if any sends fail

### After Sending
1. **Review Results**: Check for any failed sends
2. **Retry Failed Orders**: Re-select failed orders and send again if needed
3. **Check Email Logs**: Verify all sends are logged in the "Email Logs" tab
4. **Refresh the List**: Click "Refresh" to update the orders list

## Troubleshooting

### "Email notifications are disabled"
- Go to `/admin/settings`
- Enable email notifications
- Configure your email provider (SMTP or Resend)
- Save settings and try again

### Some emails fail to send
**Common causes:**
- Invalid email addresses in user accounts
- Email provider rate limits exceeded
- Temporary email server issues
- Missing order data (items, customer info)

**Solutions:**
1. Check the error message in the results
2. Verify email provider configuration
3. Re-send failed orders individually
4. Contact email provider support if needed

### Orders still appear after sending
- Click the **"Refresh"** button to reload the list
- Successfully sent emails are logged and orders will disappear

### Progress stuck at a certain percentage
- This usually means an email is taking longer to send
- Wait up to 30 seconds before refreshing
- If truly stuck, refresh the page and check Email Logs tab to see what was sent

## Technical Details

### Email Content
Bulk-sent emails contain the same content as regular order confirmations:
- Order ID and date
- Customer name
- List of items with quantities, sizes, and purchase codes
- Total amount
- Event details (if applicable)
- Claiming/delivery information (if applicable)
- Payment method (if applicable)

### Email Logging
Every email sent via bulk send is automatically logged with:
- Provider (SMTP or Resend)
- Recipient email
- Subject
- Email type: `order_confirmation`
- Status: `sent` or `failed`
- Order ID linkage
- Error message (if failed)
- Provider message ID
- Timestamp

### Database Queries
The system identifies orders without emails by:
1. Finding orders with status `paid`, `confirmed`, or `completed`
2. Checking for absence of email logs with matching order ID
3. Excluding orders that already have confirmation email logs

## Security

- **Admin Access Only**: Only users with `isShopAdmin` flag can access this feature
- **Authentication Required**: Must be logged in with valid session
- **Rate Limiting**: 100ms delay between sends to prevent abuse
- **Email Validation**: All emails validated before sending
- **Error Handling**: Failed sends don't block subsequent emails

## API Endpoints

The feature uses these server actions:
- `getOrdersWithoutEmails()` - Fetches orders missing email logs
- `sendBulkConfirmationEmails(orderIds)` - Sends emails in bulk

## Future Enhancements

Potential improvements:
- CSV export of orders without emails
- Schedule bulk sends for specific times
- Email preview before sending
- Filter by date range or event
- Bulk resend for failed emails
- Email templates customization per event

## Related Documentation

- [Email Configuration Guide](./FEATURE_GUIDE.md#email-notifications)
- [Email Logs Dashboard](./FEATURE_GUIDE.md#email-logs)
- [SMTP Setup](./README.md#smtp-email-setup)
- [Resend API Setup](./README.md#resend-api-setup)
