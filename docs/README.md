# GCash Auto-Extraction Documentation

This directory contains comprehensive documentation for the GCash reference number auto-extraction and duplicate order detection system.

## Quick Start

**New to the system?** Start here:

1. [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Quick reference guide
2. [FEATURE_GUIDE.md](FEATURE_GUIDE.md) - User and admin guide with examples

## Documentation Index

### User Guides

- **[FEATURE_GUIDE.md](FEATURE_GUIDE.md)** - Complete guide for customers and admins
  - How to use the checkout system
  - Admin dashboard walkthrough
  - FAQ and troubleshooting
  - Best practices

- **[PDF_IMAGE_SUPPORT.md](PDF_IMAGE_SUPPORT.md)** - Detailed guide for image and PDF receipts
  - Supported file types
  - Processing flow for each type
  - UI examples
  - Performance comparison
  - Error handling

### Admin Guides

- **[BATCH_OCR_GUIDE.md](BATCH_OCR_GUIDE.md)** - Batch processing for existing orders
  - How to use batch OCR feature
  - Step-by-step walkthrough
  - Processing logic
  - Troubleshooting guide

- **[PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)** - Production deployment notes
  - SSL certificate handling
  - Network configuration for Docker
  - Timeout settings
  - Troubleshooting production issues

### Technical Documentation

- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Technical implementation details
  - Features implemented
  - Files created/modified
  - Database schema changes
  - Architecture diagrams
  - Code examples

- **[GCASH.md](GCASH.md)** - Complete OCR implementation reference
  - Tesseract.js setup and usage
  - pdfreader PDF parsing
  - Regex patterns
  - Storage integration
  - Complete code examples

- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Developer quick reference
  - What was implemented
  - Key files
  - Testing instructions
  - API reference
  - Common commands

## Feature Overview

### ✨ Core Features

1. **Automatic Reference Number Extraction**
   - 📸 Image Receipts (PNG/JPG): Client-side OCR
   - 📄 PDF Invoices: Server-side parsing
   - Auto-detects file type
   - Real-time extraction with feedback

2. **Duplicate Order Prevention**
   - Server-side validation
   - Database index for fast lookups
   - Clear error messages

3. **Admin Dashboard**
   - Display reference numbers
   - Duplicate warnings with badges
   - Excel export with ref numbers
   - Batch OCR processing for existing orders

## Documentation Structure

```
docs/
├── README.md                    # This file - documentation index
├── QUICK_REFERENCE.md          # Quick reference for developers
├── FEATURE_GUIDE.md            # User and admin guide
├── PDF_IMAGE_SUPPORT.md        # Image vs PDF detailed guide
├── BATCH_OCR_GUIDE.md          # Batch processing guide
├── IMPLEMENTATION_SUMMARY.md   # Technical implementation
└── GCASH.md                    # Complete OCR reference
```

## Choose Your Path

### I'm a Customer

👉 [FEATURE_GUIDE.md](FEATURE_GUIDE.md#for-customers) - Learn how to upload receipts

### I'm an Admin

👉 [FEATURE_GUIDE.md](FEATURE_GUIDE.md#for-admins) - Learn the admin dashboard
👉 [BATCH_OCR_GUIDE.md](BATCH_OCR_GUIDE.md) - Process existing orders

### I'm a Developer

👉 [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Quick overview
👉 [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Technical details
👉 [GCASH.md](GCASH.md) - Deep dive into OCR implementation

### I Need Specific Info

| Question                                     | Document                                                                                           |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| How do I test the system?                    | [QUICK_REFERENCE.md#how-to-test](QUICK_REFERENCE.md#how-to-test)                                   |
| What's the difference between image and PDF? | [PDF_IMAGE_SUPPORT.md#performance-comparison](PDF_IMAGE_SUPPORT.md#performance-comparison)         |
| How do I process old orders?                 | [BATCH_OCR_GUIDE.md](BATCH_OCR_GUIDE.md)                                                           |
| What files were changed?                     | [IMPLEMENTATION_SUMMARY.md#files-createdmodified](IMPLEMENTATION_SUMMARY.md#files-createdmodified) |
| How does OCR work?                           | [GCASH.md#image-based-receipt-extraction-ocr](GCASH.md#image-based-receipt-extraction-ocr)         |
| How do I handle errors?                      | [FEATURE_GUIDE.md#troubleshooting](FEATURE_GUIDE.md#troubleshooting)                               |
| What are the regex patterns?                 | [GCASH.md#regex-pattern-explanations](GCASH.md#regex-pattern-explanations)                         |
| How do I batch process?                      | [BATCH_OCR_GUIDE.md#how-it-works](BATCH_OCR_GUIDE.md#how-it-works)                                 |

## Key Concepts

### Reference Number

A unique identifier (typically 13 digits) that GCash assigns to each transaction.
Example: `1234567890123`

### OCR (Optical Character Recognition)

Technology that reads text from images. We use Tesseract.js for this.

### Duplicate Detection

Prevents the same GCash payment from being used for multiple orders.

### Batch Processing

Retroactively extract reference numbers from existing orders' receipts.

## Quick Links

- **Project README**: [../README.md](../README.md)
- **Claude Instructions**: [../CLAUDE.md](../CLAUDE.md)
- **Prisma Schema**: [../prisma/schema.prisma](../prisma/schema.prisma)
- **Main Code**: `../src/lib/gcashReaders/`
- **Admin UI**: `../src/app/admin/orders/`

## Support

For questions or issues:

1. Check the relevant documentation file
2. Review the [Troubleshooting](#troubleshooting-index) section
3. Check the FAQ in [FEATURE_GUIDE.md](FEATURE_GUIDE.md#faq)
4. Review error messages in [PDF_IMAGE_SUPPORT.md](PDF_IMAGE_SUPPORT.md#error-handling)

## Troubleshooting Index

Quick links to common issues:

| Issue                   | Solution                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| OCR not extracting      | [FEATURE_GUIDE.md - What to Do If OCR Fails](FEATURE_GUIDE.md#what-to-do-if-ocr-fails)            |
| Duplicate payment error | [FEATURE_GUIDE.md - FAQ](FEATURE_GUIDE.md#q-can-i-use-the-same-gcash-payment-for-multiple-orders) |
| Batch processing stuck  | [BATCH_OCR_GUIDE.md - Processing Stuck](BATCH_OCR_GUIDE.md#processing-stuck)                      |
| PDF won't process       | [PDF_IMAGE_SUPPORT.md - PDF Won't Process](PDF_IMAGE_SUPPORT.md#pdf-wont-process)                 |
| Image won't process     | [PDF_IMAGE_SUPPORT.md - Image Won't Process](PDF_IMAGE_SUPPORT.md#image-wont-process)             |

## Version History

- **v1.0** - Initial implementation
  - Image OCR with Tesseract.js
  - Duplicate detection
  - Admin dashboard integration

- **v1.1** - PDF support
  - Server-side PDF parsing with pdfreader
  - Support for GCash transaction history PDFs

- **v1.2** - Batch processing
  - Server-side OCR for images
  - Batch processing UI for existing orders
  - Progress tracking

## Contributing

When updating this documentation:

1. Keep examples clear and concise
2. Update this README if adding new docs
3. Cross-reference related sections
4. Include code examples where helpful
5. Update version history

## License

This documentation is part of the ARSA website project.
