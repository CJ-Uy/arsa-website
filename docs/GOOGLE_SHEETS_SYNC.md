# Google Sheets Sync for Flower Fest Orders

This guide explains how to set up and use the Google Sheets sync feature for Flower Fest orders. The sync allows non-developers to view order data in a familiar spreadsheet format.

## Table of Contents

1. [Overview](#overview)
2. [Setup Guide](#setup-guide)
3. [Environment Variables](#environment-variables)
4. [How It Works](#how-it-works)
5. [Manual Sync](#manual-sync)
6. [Automated Sync](#automated-sync)
7. [Spreadsheet Format](#spreadsheet-format)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The Google Sheets sync feature automatically exports Flower Fest orders to a Google Spreadsheet every 10 minutes. This allows event organizers to:

- View orders in real-time without database access
- Filter and sort orders using spreadsheet features
- Share order data with team members
- Plan delivery logistics based on order data

---

## Setup Guide

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use an existing one)
3. Note your project ID

### Step 2: Enable Google Sheets API

1. In Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google Sheets API"
3. Click **Enable**

### Step 3: Create a Service Account

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **Service Account**
3. Name it (e.g., "arsa-sheets-sync")
4. Click **Create and Continue**
5. Skip the role assignment (we'll share the sheet directly)
6. Click **Done**

### Step 4: Generate JSON Key

1. Click on your new service account
2. Go to **Keys** tab
3. Click **Add Key** > **Create new key**
4. Choose **JSON** format
5. Save the downloaded file securely

### Step 5: Create Target Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com/)
2. Create a new spreadsheet
3. Name it (e.g., "Flower Fest 2026 Orders")
4. Copy the spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit
   ```

### Step 6: Share with Service Account

1. In your spreadsheet, click **Share**
2. Add the service account email (found in your JSON key file under `client_email`)
3. Give it **Editor** access
4. Click **Send**

### Step 7: Configure Environment Variables

Add these to your `.env` file:

```env
# Google Sheets credentials (paste the entire JSON as a single line)
GOOGLE_SHEETS_CREDENTIALS='{"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"your-service-account@your-project.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'

# Your spreadsheet ID
FLOWER_FEST_SPREADSHEET_ID="your-spreadsheet-id-here"

# Sheet name (tab name in spreadsheet)
FLOWER_FEST_SHEET_NAME="Orders"

# Secret for cron endpoint security
CRON_SECRET="generate-a-random-string-here"
```

---

## Environment Variables

| Variable                     | Required    | Description                                            |
| ---------------------------- | ----------- | ------------------------------------------------------ |
| `GOOGLE_SHEETS_CREDENTIALS`  | Yes         | Service account JSON credentials (as single-line JSON) |
| `FLOWER_FEST_SPREADSHEET_ID` | Yes         | The ID from your Google Sheet URL                      |
| `FLOWER_FEST_SHEET_NAME`     | No          | Tab name (defaults to "Orders")                        |
| `CRON_SECRET`                | Recommended | Secret for authenticating automated sync requests      |

---

## How It Works

The sync process:

1. Fetches all Flower Fest orders from the database
2. Converts each order to a spreadsheet row with relevant columns
3. Clears the existing spreadsheet data
4. Writes headers and all order data
5. Formats the header row (bold, gray background)
6. Auto-resizes columns for readability
7. Records the sync timestamp

The sync is a **full replacement** - each sync completely refreshes the spreadsheet data to ensure accuracy.

---

## Manual Sync

### From Admin Dashboard (Coming Soon)

Admins will be able to trigger a sync from the admin dashboard.

### Via API

You can trigger a sync manually via the API:

```bash
# With admin authentication (cookies)
curl -X POST https://your-domain.com/api/shop/sync-orders

# With cron secret (for scripts)
curl -X POST https://your-domain.com/api/shop/sync-orders \
  -H "x-cron-secret: your-cron-secret"
```

### Check Sync Status

```bash
curl https://your-domain.com/api/shop/sync-orders
```

Returns:

```json
{
	"configured": true,
	"lastSync": "2026-02-13T10:30:00.000Z",
	"orderCount": 42
}
```

---

## Automated Sync

### Docker/Coolify Deployment (Recommended)

For Docker deployments, use a separate cron container or add a cron job to your server.

**Option A: Host System Cron**

Add to your server's crontab (`crontab -e`):

```bash
*/10 * * * * curl -X POST https://your-domain.com/api/shop/sync-orders -H "x-cron-secret: your-cron-secret" > /dev/null 2>&1
```

**Option B: External Cron Service**

Use a free service like [cron-job.org](https://cron-job.org):

1. Create a free account
2. Add a new cron job:
   - URL: `https://your-domain.com/api/shop/sync-orders`
   - Method: POST
   - Schedule: Every 10 minutes
   - Header: `x-cron-secret: your-cron-secret`

### GitHub Actions

Create `.github/workflows/sync-orders.yml`:

```yaml
name: Sync Orders to Google Sheets

on:
  schedule:
    - cron: "*/10 * * * *" # Every 10 minutes
  workflow_dispatch: # Allow manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger sync
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/shop/sync-orders \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}"
```

---

## Spreadsheet Format

The sync creates the following columns:

| Column               | Description                                |
| -------------------- | ------------------------------------------ |
| Order ID             | Unique order identifier                    |
| Order Date           | When the order was placed                  |
| Status               | pending/paid/confirmed/completed/cancelled |
| Customer Name        | Buyer's name                               |
| Customer Email       | Buyer's email                              |
| Customer Phone       | Buyer's contact number                     |
| Recipient Name       | Who receives the flowers                   |
| Pickup/Delivery      | Fulfillment type                           |
| Delivery Location 1  | First delivery option location             |
| Delivery Time 1      | First delivery option time slot            |
| Delivery Location 2  | Second delivery option location            |
| Delivery Time 2      | Second delivery option time slot           |
| Delivery Location 3  | Third delivery option location             |
| Delivery Time 3      | Third delivery option time slot            |
| Preferred Option     | Which delivery option is preferred         |
| Card Message         | Message for the card                       |
| Anonymous?           | Whether sender wants to be anonymous       |
| Sender Name on Card  | Name to show on card (if not anonymous)    |
| Items                | Summary of ordered items                   |
| Total Amount         | Order total in PHP                         |
| GCash Ref No         | Payment reference number                   |
| Special Instructions | Additional notes                           |
| Delivery Date        | Scheduled delivery date                    |
| Delivery Time Slot   | Delivery time preference                   |

---

## Troubleshooting

### "Google Sheets is not configured"

- Check that `GOOGLE_SHEETS_CREDENTIALS` is set
- Check that `FLOWER_FEST_SPREADSHEET_ID` is set
- Restart your application after adding environment variables

### "Invalid credentials"

- Verify the JSON is valid (try parsing it)
- Check that the private key has proper newline characters (`\n`)
- Ensure the service account email matches what's shared with the spreadsheet

### "Permission denied"

- Verify the spreadsheet is shared with the service account email
- Ensure the service account has Editor access
- Check that the spreadsheet ID is correct

### "Sheet not found"

- Verify `FLOWER_FEST_SHEET_NAME` matches an existing tab name
- Default is "Orders" - create this tab if it doesn't exist

### Sync timing issues

- Cron jobs may have slight delays
- Check your cron service logs for errors
- Verify the API endpoint is accessible

### Data not updating

- Check the "Last Synced" timestamp in column AA1
- Verify the API returns success
- Check server logs for errors

---

## Security Considerations

1. **Service Account Key**: Never commit the JSON key to version control
2. **Cron Secret**: Use a strong, random string for the `CRON_SECRET`
3. **Spreadsheet Access**: Only share with necessary team members
4. **API Access**: The sync endpoint requires either admin auth or cron secret

---

## Related Documentation

- [Flower Fest Custom Checkout](CUSTOM_EVENT_PAGES.md)
- [Delivery Cutoff Setup](DELIVERY_CUTOFF_SETUP.md)
- [E-Shop System Overview](ESHOP_SYSTEM.md)
