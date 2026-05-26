# Docker Deployment Guide

This guide covers deploying the ARSA website using Docker and Docker Compose.

## Quick Start

### Prerequisites

- Docker (v20.10+)
- Docker Compose (v2.0+)
- `.env` file with required environment variables

### Build and Run

```bash
# Build the image
docker compose build

# Start the container
docker compose up -d

# View logs
docker compose logs -f arsa-website

# Stop the container
docker compose down
```

## Optimization Features

### 1. Multi-Stage Build

The Dockerfile uses a multi-stage build to minimize the final image size:

- **deps**: Installs production dependencies only
- **prisma**: Generates Prisma client (cached separately for efficiency)
- **builder**: Builds the Next.js application
- **runner**: Final lightweight production image (~150MB)

### 2. Layer Caching

Dependencies are cached in separate layers:

- `package.json` changes trigger dependency reinstall
- Prisma schema changes trigger client regeneration
- Source code changes only rebuild the application

### 3. Build Performance

- Uses Node.js 24 Alpine for smaller image size
- Enables BuildKit for parallel builds
- Excludes devDependencies from production
- Cleans npm cache after install

### 4. Security Features

- Runs as non-root user (`nextjs:nodejs`)
- Uses `no-new-privileges` security option
- Minimal attack surface with Alpine base

### 5. Resource Management

- CPU limits: 2 cores max, 0.5 cores reserved
- Memory limits: 2GB max, 512MB reserved
- Log rotation: Max 3 files of 10MB each

## Environment Variables

Create a `.env` file from `.env.docker.example`:

```bash
cp .env.docker.example .env
```

Required variables:

- `DATABASE_URL`: PostgreSQL connection string
- `BETTER_AUTH_SECRET`: Secret key for authentication
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: OAuth credentials
- `MINIO_*`: MinIO/S3 storage configuration

## Health Checks

The application includes a health check endpoint at `/api/health` that:

- Returns `200 OK` when the app is healthy
- Is checked every 30 seconds
- Allows 40 seconds startup time
- Retries 3 times before marking as unhealthy

## Production Deployment

### 1. Enable BuildKit (recommended)

```bash
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
```

### 2. Build with Cache

```bash
# Build and cache
docker compose build

# Force rebuild without cache
docker compose build --no-cache
```

### 3. Update Deployment

```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose up -d --build

# Or use zero-downtime deployment
docker compose up -d --no-deps --build arsa-website
```

## Monitoring

### View Logs

```bash
# All logs
docker compose logs

# Follow logs
docker compose logs -f

# Last 100 lines
docker compose logs --tail=100
```

### Check Resource Usage

```bash
docker stats arsa-website
```

### Health Status

```bash
# Check health endpoint
curl http://localhost:3000/api/health

# Check container health
docker inspect --format='{{.State.Health.Status}}' arsa-website
```

## Troubleshooting

### Container Won't Start

1. Check logs:

   ```bash
   docker compose logs arsa-website
   ```

2. Verify environment variables:

   ```bash
   docker compose config
   ```

3. Check database connectivity:
   ```bash
   docker compose exec arsa-website npx prisma db pull
   ```

### Out of Memory

Increase memory limits in `docker-compose.yaml`:

```yaml
deploy:
  resources:
    limits:
      memory: 4G # Increase from 2G
```

### Slow Builds

1. Enable BuildKit
2. Use build cache
3. Check `.dockerignore` excludes unnecessary files

### Permission Issues

Ensure files are owned by the nextjs user (UID 1001):

```bash
docker compose exec arsa-website ls -la
```

## Advanced Configuration

### Custom Port

Change the port in `.env`:

```env
PORT=8080
```

Then update `docker-compose.yaml`:

```yaml
ports:
  - "8080:3000"
```

### Database Migrations

Run migrations before starting:

```bash
# One-time setup
docker compose run --rm arsa-website npx prisma migrate deploy

# Then start normally
docker compose up -d
```

### Development vs Production

For development, use:

```bash
npm run dev
```

For production, always use Docker for consistency and optimization.

## Performance Tips

1. **Use BuildKit**: Enables parallel builds and better caching
2. **Prune regularly**: Remove unused images/containers
   ```bash
   docker system prune -a
   ```
3. **Monitor resources**: Adjust limits based on actual usage
4. **Use compose profiles**: Separate dev/prod configurations

## Security Best Practices

1. **Never commit .env**: Keep secrets out of version control
2. **Use secrets management**: Consider Docker secrets for sensitive data
3. **Regular updates**: Keep base images updated
   ```bash
   docker compose pull
   docker compose up -d
   ```
4. **Scan images**: Use security scanners
   ```bash
   docker scan arsa-website
   ```

## Size Optimization

Current image sizes:

- Base (node:24-alpine): ~180MB
- Final image (with app): ~150-200MB

To check your image size:

```bash
docker images | grep arsa-website
```
