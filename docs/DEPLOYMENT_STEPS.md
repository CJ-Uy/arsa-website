# Deployment Steps for SSL Fix

## The Issue

The batch OCR feature is failing in production with SSL certificate errors because the **old code is still running**. The fixes have been made to the source code, but the application hasn't been rebuilt with the new code yet.

## Required Steps

### 1. Rebuild the Application

The application needs to be rebuilt to include the SSL fixes:

```bash
# Stop the running containers
docker compose down

# Rebuild the Next.js application (with new SSL handling code)
npm run build

# Or rebuild the Docker image if using Docker build
docker compose build --no-cache

# Start the containers again
docker compose up -d
```

### 2. Verify the Build

Check that the new code is included:

```bash
# Check build logs
docker compose logs web --tail 100

# Look for successful build completion
# You should see: "✓ Compiled successfully"
```

### 3. Test the Fix

Once redeployed:

1. Go to Admin Dashboard → Orders
2. Click "Batch OCR Processing"
3. Select 1 order
4. Process it
5. Check logs for success:

```bash
docker logs arsa-website-1 --tail 50 -f
```

**Look for:**

- ✅ `Successfully fetched image (XXXXX bytes)`
- ✅ `Starting server-side OCR process...`

**Should NOT see:**

- ❌ `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`
- ❌ `ETIMEDOUT` (unless network is actually slow)

## Quick Deployment Commands

### Option 1: Docker Compose (Recommended)

```bash
# Stop, rebuild, and restart
docker compose down
docker compose build --no-cache web
docker compose up -d

# Monitor logs
docker compose logs -f web
```

### Option 2: Manual Build + Docker

```bash
# Build Next.js
npm run build

# Rebuild Docker image
docker build -t arsa-website .

# Restart container
docker compose up -d

# Or if not using compose:
docker stop arsa-website-1
docker rm arsa-website-1
docker run -d --name arsa-website-1 arsa-website
```

### Option 3: Development Server (Testing Only)

```bash
# Generate Prisma client
npx prisma generate

# Run dev server
npm run dev
```

## Verification Checklist

After deployment, verify:

- [ ] Application starts without errors
- [ ] Admin dashboard loads
- [ ] Batch OCR button appears
- [ ] Can select orders for processing
- [ ] Processing shows progress
- [ ] Images fetch successfully (check logs)
- [ ] OCR extracts reference numbers
- [ ] No SSL certificate errors in logs

## What Changed

The SSL fix added these changes:

**File: `src/lib/gcashReaders/readReceipt.server.ts`**

```typescript
// Added HTTPS agent for self-signed certificates
import https from "https";

const httpsAgent = new https.Agent({
	rejectUnauthorized: false, // <-- This is the fix
});

// Added timeout and agent to fetch
const fetchOptions: RequestInit = {
	signal: AbortSignal.timeout(30000),
};

if (imageUrl.startsWith("https://")) {
	fetchOptions.agent = httpsAgent; // <-- This applies the fix
}
```

**File: `src/app/admin/orders/batchOcrActions.ts`**

- Same SSL handling for PDF fetches

## Troubleshooting

### Still Getting SSL Errors After Rebuild

**Cause:** Old build cache
**Solution:**

```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Rebuild
npm run build
```

### Build Fails

**Check:**

1. Node.js version (need 18+)
2. All dependencies installed: `npm install`
3. Prisma client generated: `npx prisma generate`
4. TypeScript compiles: `npx tsc --noEmit`

### Docker Build Fails

**Check:**

1. Docker daemon running
2. Enough disk space
3. Dockerfile is correct
4. .dockerignore doesn't exclude necessary files

### Application Runs But Still Fails

**Possible issues:**

1. Environment variables not set correctly
2. MinIO not accessible from container
3. Network configuration issue

**Check:**

```bash
# Test MinIO connectivity from container
docker exec arsa-website-1 curl -I https://your-minio-url

# Check environment variables
docker exec arsa-website-1 env | grep MINIO
```

## Production Deployment Workflow

For your production environment:

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
npm install

# 3. Generate Prisma client
npx prisma generate

# 4. Build Next.js
npm run build

# 5. Rebuild Docker images
docker compose build --no-cache

# 6. Restart services
docker compose down
docker compose up -d

# 7. Monitor startup
docker compose logs -f

# 8. Test batch OCR
# Go to /admin/orders and try processing 1 order
```

## Environment Variables Check

Ensure these are set in your `.env`:

```bash
# Database
DATABASE_URL=postgresql://...

# MinIO/Storage
MINIO_ENDPOINT=https://your-minio-url
# ... other MinIO vars

# Next.js
NODE_ENV=production
```

## Summary

The SSL fix is ready in the code, but you need to:

1. **Rebuild** the application (`npm run build`)
2. **Rebuild** Docker images (`docker compose build`)
3. **Restart** containers (`docker compose up -d`)
4. **Test** the batch OCR feature

The errors you're seeing are from the old compiled code in `.next/server/chunks/`. Once rebuilt, the new code with SSL handling will be used.
