# Coolify Deployment Guide

## Quick Setup

### 1. Environment Variables

In Coolify, add these environment variables to your application:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Authentication
BETTER_AUTH_SECRET=your-secret-here-min-32-chars
BETTER_AUTH_URL=https://yourdomain.com

# OAuth (Google)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# MinIO/S3
MINIO_ENDPOINT=your-minio-endpoint
MINIO_PORT=9000
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key
MINIO_USE_SSL=false
MINIO_PUBLIC_BUCKET=products
MINIO_PRIVATE_BUCKET=receipts

# Next.js
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### 2. Build Configuration

**IMPORTANT**: Increase deployment timeout to avoid build timeouts.

In Coolify:

1. Go to your application
2. Navigate to **Advanced** or **Settings** tab
3. Find **Build Timeout** or **Deployment Timeout**
4. Set to **90-120 minutes** (safe buffer)

### 3. Build Performance

The application includes several optimizations to reduce build time:

- **TypeScript**: Type checking is skipped during build (done in CI/CD separately)
- **Webpack**: Memory optimizations enabled
- **Node.js**: Increased memory allocation (4GB) for large builds
- **Expected build time**: 15-30 minutes (down from 60+ minutes)

### 4. Port Configuration

- Application runs on port **3000**
- Coolify should automatically map this to external port 80/443

### 5. Health Checks

The application provides a health endpoint at `/api/health`:

```bash
curl https://yourdomain.com/api/health
# Response: {"status":"ok","timestamp":"2025-11-04T..."}
```

Configure in Coolify:

- **Health Check Path**: `/api/health`
- **Health Check Interval**: 30s
- **Timeout**: 5s

## Deployment Process

### Initial Deployment

1. **Connect Repository**: Link your GitHub repository in Coolify
2. **Set Environment Variables**: Add all required variables from above
3. **Configure Build Settings**:
   - Build Pack: Docker
   - Dockerfile Path: `./dockerfile`
   - Docker Compose Path: `./docker-compose.yaml` (if using)
4. **Increase Timeout**: Set deployment timeout to 90-120 minutes
5. **Deploy**: Click "Deploy" and monitor logs

### Expected Build Stages

You'll see these stages in the build logs:

```
1. [deps] Installing dependencies (~5 min)
   - Installing libc6-compat
   - Running npm ci
   - Installing Alpine-compatible SWC binary

2. [prisma] Generating Prisma Client (~2 min)
   - Generating client for linux-musl
   - Custom output to src/generated/prisma

3. [builder] Building Next.js (~15-25 min)
   - Compiling application
   - Optimizing bundle
   - Creating standalone output

4. [runner] Creating production image (~2 min)
   - Copying standalone files
   - Setting up non-root user
   - Final image size: ~150-200MB
```

## Troubleshooting

### Build Timeout After ~30 Minutes

**Symptom**: `App\Jobs\ApplicationDeploymentJob has timed out`

**Solution**:

1. Increase Coolify deployment timeout to 90-120 minutes
2. The optimizations in `next.config.ts` should prevent this going forward
3. Retry the deployment

### Out of Memory During Build

**Symptom**: `JavaScript heap out of memory` or build crashes

**Solution**:

- Already addressed with `NODE_OPTIONS="--max-old-space-size=4096"`
- If still occurs, increase to 8192: `NODE_OPTIONS="--max-old-space-size=8192"`

### Prisma Client Errors

**Symptom**: `Error: Prisma Client could not locate the Query Engine`

**Solution**:

- Already addressed with `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]`
- If still occurs, verify Prisma files are being copied correctly in Dockerfile

### Database Connection Issues

**Symptom**: `Can't reach database server` or connection timeout

**Solution**:

1. Verify `DATABASE_URL` is correct in Coolify environment variables
2. Ensure database is accessible from Coolify network
3. Check if database requires whitelisting Coolify's IP

### SWC Binary Missing

**Symptom**: `Failed to load SWC binary for linux/x64`

**Solution**:

- Already addressed with Alpine-compatible SWC installation
- Dockerfile installs `@next/swc-linux-x64-musl` in deps stage

## Performance Optimization

### Build Speed

Current optimizations:

- ✅ Type checking skipped during build
- ✅ Webpack memory optimizations enabled
- ✅ Node.js memory increased to 4GB
- ✅ Docker layer caching (deps, prisma, builder stages)

Potential future optimizations:

- Enable SWC minification instead of Terser
- Use Turbopack for production builds (experimental)
- Implement build caching in Coolify

### Runtime Performance

- ✅ Standalone output mode (minimal bundle size)
- ✅ Non-root user for security
- ✅ Resource limits configured (2 CPU, 2GB RAM)
- ✅ Log rotation (10MB max, 3 files)

## Monitoring

### Logs

View application logs in Coolify:

```bash
# Coolify provides log viewer in UI
# Or via CLI:
docker logs <container-name> --tail 100 -f
```

### Resources

Monitor CPU/Memory usage in Coolify dashboard:

- Normal operation: ~512MB RAM, <0.5 CPU
- Under load: Up to 2GB RAM, 2 CPU (limits)

## Database Migrations

When deploying schema changes:

1. **Update schema**: Edit `prisma/schema.prisma`
2. **Generate client**: Run `npx prisma generate` locally
3. **Create migration**: Run `npx prisma migrate dev --name your-migration-name`
4. **Commit files**: Commit schema, migration files, and generated client
5. **Deploy**: Coolify will automatically run `npx prisma generate` during build
6. **Apply migration**: SSH into container and run `npx prisma migrate deploy`

Or use Coolify's pre-deploy command:

```bash
npx prisma migrate deploy
```

## Rollback

If deployment fails:

1. **Coolify UI**: Click "Rollback" to previous deployment
2. **Manual**: Redeploy previous commit from GitHub
3. **Database**: If migration applied, manually rollback in database

## Security Checklist

- ✅ Non-root user (nextjs:nodejs)
- ✅ Security option: `no-new-privileges:true`
- ✅ Environment variables stored securely in Coolify
- ✅ Secrets not in Dockerfile or code
- ✅ Private receipts bucket requires authentication
- ✅ Role-based admin access (isShopAdmin, isRedirectsAdmin)
- ✅ OAuth restricted to @student.ateneo.edu emails

## Support

For issues:

1. Check Coolify build logs first
2. Verify environment variables are set
3. Review this troubleshooting guide
4. Check [DOCKER.md](DOCKER.md) for Docker-specific issues
