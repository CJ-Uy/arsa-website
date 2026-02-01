# Email Confirmation Implementation Plan

## Overview

Implement order confirmation emails sent to customers after placing an order, with admin controls to configure the email service.

## Technology Choice: Nodemailer with Google SMTP

- Uses standard SMTP protocol with Google's servers
- No additional service signup required
- Free with Gmail (500 emails/day) or Google Workspace (2000 emails/day)
- Well-established library with TypeScript support

## Implementation Steps

### 1. Install Dependencies

```bash
npm install nodemailer
npm install -D @types/nodemailer
```

### 2. Add Email Configuration to ShopSettings

Extend the existing `ShopSettings` model in `prisma/schema.prisma`:

- `emailEnabled` (Boolean) - Toggle email confirmations on/off
- `emailFromAddress` (String) - Sender email address (your Gmail/Workspace email)
- `emailFromName` (String) - Sender display name (e.g., "ARSA Shop")
- `emailReplyTo` (String, optional) - Reply-to address

Note: SMTP password will be stored as environment variable `SMTP_PASSWORD` for security.
This should be a Google "App Password" (not your regular password).

### 3. Create Email Service

Create `src/lib/email.ts`:

- Initialize Nodemailer transporter with Gmail SMTP
- `sendOrderConfirmation(order, customer, eventName?)` function
- Handle errors gracefully (don't fail order if email fails)

### 4. Create Email Template

Create `src/lib/email-templates/order-confirmation.ts`:

- HTML email template with order summary
- Order details: items, sizes, quantities
- Purchase codes (if any)
- Order total
- "What happens next" information

### 5. Integrate with Order Creation

Modify `src/app/shop/actions.ts` `createOrder()`:

- After successful order creation, fetch email settings
- If enabled, send confirmation email
- Log any email errors but don't fail the order

### 6. Create Admin Email Settings UI

Add to admin dashboard:

- Toggle to enable/disable email confirmations
- Input for "From" email address
- Input for "From" display name
- Input for "Reply-to" address (optional)
- Test email button to verify configuration

Location: Either new page `/admin/settings` or add section to existing `/admin` page.

### 7. Environment Variables

Add to `.env`:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

**Setting up Google App Password:**

1. Enable 2-Step Verification on your Google account
2. Go to Google Account → Security → App passwords
3. Create a new app password for "Mail"
4. Use this 16-character password as SMTP_PASSWORD

## Files to Create/Modify

### New Files:

1. `src/lib/email.ts` - Email service with Nodemailer SMTP
2. `src/lib/email-templates/order-confirmation.ts` - HTML email template

### Modified Files:

1. `prisma/schema.prisma` - Add email fields to ShopSettings
2. `src/app/shop/actions.ts` - Add email sending after order creation
3. `src/app/admin/page.tsx` or new settings page - Email configuration UI
4. `.env.example` - Document SMTP variables

## Email Template Content

The confirmation email will include:

- Order ID
- Order date
- List of items (name, size, quantity, price)
- Purchase codes (if applicable)
- Order total
- Payment status
- Next steps information
- Link to view order (if logged in)

## Security Considerations

- SMTP password stored in environment variable, not database
- Use App Password, not regular Google password
- Email failures logged but don't block orders

## Google SMTP Configuration

```typescript
const transporter = nodemailer.createTransport({
	host: "smtp.gmail.com",
	port: 587,
	secure: false, // Use STARTTLS
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASSWORD,
	},
});
```

## Testing

1. Set up Google App Password
2. Add SMTP credentials to .env
3. Enable emails in admin settings
4. Test with a small order
5. Verify email delivery and formatting
