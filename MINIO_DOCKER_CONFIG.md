# MinIO Docker Network Configuration

## The Problem

When the application runs in Docker, MinIO URLs need to work in two different contexts:

1. **Browser (Client-Side)**: Users' browsers need to access images using an external URL like `https://minio.yourdomain.com:9000/receipts/image.jpg`
2. **Server (Docker Network)**: The Next.js container needs to fetch images using an internal Docker network URL like `http://minio:9000/receipts/image.jpg`

The database stores URLs using the external endpoint (so browsers can load images), but server-side OCR processing needs to convert these to internal URLs.

## Solution: Two MinIO Endpoints

### Environment Variables

Add these to your `.env` file or Coolify environment variables:

```bash
# External endpoint - used for generating URLs stored in database
# This is what browsers will use to fetch images
MINIO_ENDPOINT=minio.yourdomain.com  # or your external domain/IP

# Internal endpoint - used for server-side fetching within Docker network
# This is the Docker service name from your docker-compose.yml
MINIO_INTERNAL_ENDPOINT=minio  # or whatever your MinIO container is named

MINIO_PORT=9000
MINIO_USE_SSL=true  # or false depending on your setup
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key
```

### How It Works

1. When images are uploaded, [minio.ts](src/lib/minio.ts) generates URLs using `MINIO_ENDPOINT` (external)
2. These URLs are stored in the database
3. When batch OCR fetches images, [readReceipt.server.ts](src/lib/gcashReaders/readReceipt.server.ts) automatically converts:
   - `https://minio.yourdomain.com:9000/receipts/image.jpg` → `http://minio:9000/receipts/image.jpg`
4. The internal Docker network resolves `minio` to the correct container

### If You Don't Use Docker

If your application and MinIO are on the same machine but not using Docker:

```bash
MINIO_ENDPOINT=localhost
MINIO_INTERNAL_ENDPOINT=localhost
```

Or if MinIO is on a different server but accessible via the same hostname:

```bash
MINIO_ENDPOINT=minio.example.com
# Don't set MINIO_INTERNAL_ENDPOINT - it will use the same as MINIO_ENDPOINT
```

## Deployment Steps

1. Add `MINIO_INTERNAL_ENDPOINT` to your environment variables in Coolify
2. Set it to the name of your MinIO Docker service (usually just `minio`)
3. Rebuild and redeploy your application
4. Test batch OCR - you should see logs showing URL conversion:
   ```
   [OCR] Converted external URL to internal Docker URL
   [OCR] Original: https://minio.yourdomain.com:9000/receipts/abc123.jpg
   [OCR] Internal: http://minio:9000/receipts/abc123.jpg
   ```

## Troubleshooting

### Still getting "fetch failed"?

Check your docker-compose.yml or Coolify network settings:

1. Ensure the Next.js container and MinIO container are on the same Docker network
2. Verify the MinIO service name matches `MINIO_INTERNAL_ENDPOINT`
3. Check if MinIO is accessible from the Next.js container:
   ```bash
   docker exec -it <nextjs-container> sh
   wget http://minio:9000  # Should connect
   ```

### SSL/TLS issues with internal endpoint?

Internal Docker network usually uses HTTP (not HTTPS):

- External: `https://minio.yourdomain.com:9000`
- Internal: `http://minio:9000`

The URL conversion automatically handles protocol changes if the internal endpoint doesn't include a protocol.
