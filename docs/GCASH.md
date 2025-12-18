# GCash OCR Batch Processing - Docker Deployment Fix

## Problem Summary

Batch OCR was failing with "fetch failed" error when trying to fetch receipt images from MinIO in production (Coolify/Docker). The receipts were viewable in browsers but not accessible from server-side code.

**Root Cause**: Docker networking mismatch

- URLs stored in database use external endpoint (e.g., `https://minio.yourdomain.com:9000`)
- Server code running inside Docker container needs internal endpoint (e.g., `http://minio:9000`)

## Solution Implemented

Added automatic URL conversion in [readReceipt.server.ts](src/lib/gcashReaders/readReceipt.server.ts) that:

1. Detects when running in Docker with different internal/external endpoints
2. Converts external URLs to internal Docker network URLs
3. Automatically switches from HTTPS to HTTP for internal network
4. Provides detailed logging for debugging

## Deployment Steps

### 1. Add Environment Variable to Coolify

In your Coolify environment variables, add:

```
MINIO_INTERNAL_ENDPOINT=minio
```

**Important**: Replace `minio` with the actual Docker service name of your MinIO container if it's different. This is typically defined in your docker-compose.yml.

### 2. Verify Existing Variables

Make sure you have these set (you should already have them):

```
MINIO_ENDPOINT=your-external-domain.com
MINIO_PORT=9000
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=your-key
MINIO_SECRET_KEY=your-secret
```

### 3. Deploy Updated Code

Commit and push the changes:

```bash
git add .
git commit -m "Fix Docker networking for batch OCR"
git push
```

Coolify should automatically rebuild and redeploy.

### 4. Test Batch OCR

After deployment:

1. Go to Admin → Orders
2. Select orders with receipts
3. Click "Process Selected with OCR"
4. Check the logs in Coolify

**Expected logs**:

```
[OCR] Converted external URL to internal Docker URL
[OCR] Original: https://minio.yourdomain.com:9000/receipts/abc123.jpg
[OCR] Internal: http://minio:9000/receipts/abc123.jpg
[OCR] Initiating fetch request...
[OCR] Fetch response status: 200 OK
Starting server-side OCR process on receipt image...
```

## Troubleshooting

### Still getting "fetch failed"?

1. **Check Docker network**: Ensure Next.js and MinIO containers are on the same network
2. **Verify service name**: Run in Coolify terminal:

   ```bash
   docker ps  # Find your MinIO container name
   ```

   The service name should match `MINIO_INTERNAL_ENDPOINT`

3. **Test connectivity**: From the Next.js container:
   ```bash
   docker exec -it <nextjs-container> sh
   curl http://minio:9000  # Should connect
   ```

### Wrong service name?

If your MinIO container is named differently (e.g., `minio-storage`), update:

```
MINIO_INTERNAL_ENDPOINT=minio-storage
```

### Not using Docker?

If running locally or on same server without Docker:

```
MINIO_INTERNAL_ENDPOINT=localhost
```

Or just don't set `MINIO_INTERNAL_ENDPOINT` at all - it will use `MINIO_ENDPOINT` by default.

## Files Changed

1. [readReceipt.server.ts](src/lib/gcashReaders/readReceipt.server.ts:59-81) - Added URL conversion logic
2. [next.config.ts](next.config.ts) - Added Tesseract.js webpack configuration
3. [dockerfile](dockerfile:87-89) - Copy Tesseract.js worker files to runtime
4. [MINIO_DOCKER_CONFIG.md](MINIO_DOCKER_CONFIG.md) - Detailed configuration guide
5. This file (GCASH.md) - Deployment instructions

## Previous Fixes Applied

This fix builds on previous solutions for:

- ✅ SSL certificate validation (`NODE_TLS_REJECT_UNAUTHORIZED=0` in Dockerfile)
- ✅ Turbopack build crash (disabled for production)
- ✅ DATABASE_URL build requirement (dummy URL in Dockerfile)
- ✅ MinIO bucket policy (receipts bucket now public)
- ✅ Docker networking for server-side fetches
- ✅ Tesseract.js worker files (copied to standalone output)

## Next Steps

After successful deployment and testing, you can:

1. Remove the `fix-minio-policy.ts` file (no longer needed)
2. Clean up any test orders used for debugging
3. Monitor OCR batch processing performance in production
