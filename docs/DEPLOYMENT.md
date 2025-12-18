# Deployment Guide for Split Architecture

## Architecture

- **Next.js App**: Laptop (Windows/Linux)
- **PostgreSQL + MinIO**: VPS (Remote)

## Critical .env Configuration

### On Your Laptop (Next.js App)

Update your `.env` file with optimized connection parameters:

```bash
# Database URL with connection pooling parameters
# IMPORTANT: Add connection_limit and pool_timeout to reduce latency
DATABASE_URL="postgresql://username:password@your-vps-ip:5432/database_name?connection_limit=20&pool_timeout=10&connect_timeout=10"

# MinIO configuration
MINIO_ENDPOINT=your-vps-ip
MINIO_PORT=9000
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key
MINIO_BUCKET=arsa-bucket

# Node.js optimization
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=4096

# Better Auth (your existing config)
BETTER_AUTH_SECRET=your_secret
BETTER_AUTH_URL=http://your-laptop-ip:3000
```

### On Your VPS (PostgreSQL)

#### 1. PostgreSQL Optimization

Edit `/etc/postgresql/*/main/postgresql.conf`:

```conf
# Connection Pooling
max_connections = 100

# Memory Settings (adjust based on your VPS RAM)
shared_buffers = 256MB              # 25% of RAM
effective_cache_size = 1GB          # 50-75% of RAM
work_mem = 16MB
maintenance_work_mem = 64MB

# Performance for SSD
random_page_cost = 1.1
effective_io_concurrency = 200

# Logging slow queries
log_min_duration_statement = 1000   # Log queries > 1 second

# Network settings for remote connections
listen_addresses = '*'              # Allow remote connections
```

#### 2. PostgreSQL pg_hba.conf

Edit `/etc/postgresql/*/main/pg_hba.conf`:

```conf
# Add this line to allow your laptop to connect
host    all             all             your-laptop-ip/32       md5
# Or allow from any IP (less secure but easier for testing)
host    all             all             0.0.0.0/0               md5
```

#### 3. Restart PostgreSQL

```bash
sudo systemctl restart postgresql
```

#### 4. Firewall Configuration

```bash
# Allow PostgreSQL port
sudo ufw allow 5432/tcp

# Allow MinIO port
sudo ufw allow 9000/tcp

# Reload firewall
sudo ufw reload
```

## Build and Run on Laptop

### Development Mode (with live reload)

```bash
npm run dev
```

Access at: `http://localhost:3000`

### Production Mode

```bash
# Build
npm run build

# Start production server
npm start
```

Or use PM2 for better process management:

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start npm --name "arsa-website" -- start

# Auto-restart on laptop reboot
pm2 startup
pm2 save

# Monitor
pm2 monit

# View logs
pm2 logs arsa-website
```

## Performance Testing

### Before Testing

1. **Clear cache:**

```bash
curl -X DELETE http://localhost:3000/api/cache-stats
```

2. **Monitor cache in real-time:**

```bash
# Windows (PowerShell)
while ($true) {
  curl http://localhost:3000/api/cache-stats | ConvertFrom-Json | Select -ExpandProperty stats | Select totalEntries
  Start-Sleep -Seconds 1
  Clear-Host
}

# Linux/Mac
watch -n 1 'curl -s http://localhost:3000/api/cache-stats | jq ".stats.totalEntries"'
```

### Run Load Tests

```bash
# Install autocannon globally
npm install -g autocannon

# Test 400 concurrent users for 60 seconds
autocannon -c 400 -d 60 http://localhost:3000/shop

# Test 1000 concurrent users
autocannon -c 1000 -d 60 http://localhost:3000/shop

# Test specific endpoints
autocannon -c 500 -d 30 http://localhost:3000/api/health
```

### Expected Results After Optimization

**Before optimization:**

- 400 users: 90% timeout
- 12.38 req/sec

**After optimization (with caching):**

- 400 users: < 5% errors
- 500-1000+ req/sec
- 95%+ cache hit rate

## Monitoring Commands

### Check Cache Performance

```bash
# Get cache stats
curl http://localhost:3000/api/cache-stats | jq

# Expected output:
{
  "success": true,
  "stats": {
    "totalEntries": 12,
    "entries": [
      {
        "key": "products:all",
        "ageSeconds": 5,
        "ttlSeconds": 30,
        "expiresIn": 25
      }
    ]
  }
}
```

### Check Database Connections (on VPS)

```bash
ssh your-vps

# Connect to PostgreSQL
sudo -u postgres psql

# Check current connections
SELECT count(*), state FROM pg_stat_activity GROUP BY state;

# Check connection limit
SHOW max_connections;

# Check slow queries (if enabled)
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## Troubleshooting

### Issue: High Latency / Timeouts

**Symptoms:**

- Requests taking > 1 second
- Timeout errors in load tests

**Solutions:**

1. **Check network latency:**

```bash
# Ping your VPS
ping your-vps-ip

# Expected: < 50ms for good performance
```

2. **Verify caching is working:**

```bash
curl http://localhost:3000/api/cache-stats

# Should show cached entries
# If totalEntries = 0, caching isn't working
```

3. **Check PostgreSQL connections:**

```sql
-- On VPS
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- If this is near max_connections, increase it
ALTER SYSTEM SET max_connections = 150;
-- Then restart PostgreSQL
```

4. **Increase cache TTL:**

Edit `src/app/shop/actions.ts`:

```typescript
// Increase from 30s to 60s
const products = await withCache(
  cacheKeys.products(category),
  60000, // Changed from 30000
  async () => { ... }
);
```

### Issue: "Too many connections" Error

**Solution:**

1. **On VPS - Increase PostgreSQL connections:**

```bash
sudo nano /etc/postgresql/*/main/postgresql.conf

# Change:
max_connections = 200

# Restart:
sudo systemctl restart postgresql
```

2. **In .env - Increase connection limit:**

```bash
DATABASE_URL="postgresql://...?connection_limit=30&pool_timeout=15"
```

### Issue: Cache Not Updating

**Symptoms:**

- Products don't update after admin changes
- Cart shows old data

**Solution:**

Clear cache manually:

```bash
curl -X DELETE http://localhost:3000/api/cache-stats
```

Or invalidate specific keys in admin actions (add to admin product update):

```typescript
import { cache, cacheKeys } from "@/lib/cache";

// After updating product
cache.deletePattern("products:.*");
```

### Issue: Memory Leaks

**Symptoms:**

- Laptop slows down over time
- PM2 shows increasing memory usage

**Solution:**

1. **Increase Node.js memory:**

```bash
# In .env
NODE_OPTIONS=--max-old-space-size=8192
```

2. **Restart app periodically:**

```bash
# With PM2
pm2 restart arsa-website

# Or schedule automatic restart
pm2 restart arsa-website --cron "0 4 * * *"  # Restart daily at 4 AM
```

## Network Optimization Tips

### 1. Use a VPN/Tunneling Service

If network latency is high:

```bash
# Option A: Tailscale (easiest)
# Install on both laptop and VPS
# Creates a private network with better routing

# Option B: WireGuard
# Manual setup but very fast
```

### 2. Database Connection Keep-Alive

Already configured in your optimized setup:

```
?connect_timeout=10&pool_timeout=10&connection_limit=20
```

### 3. Enable PostgreSQL Connection Pooling on VPS

Install PgBouncer:

```bash
# On VPS
sudo apt install pgbouncer

# Edit /etc/pgbouncer/pgbouncer.ini
[databases]
arsa = host=localhost port=5432 dbname=your_database

[pgbouncer]
listen_port = 6432
listen_addr = 0.0.0.0
auth_type = md5
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25

# Start PgBouncer
sudo systemctl start pgbouncer

# Update .env on laptop to use port 6432
DATABASE_URL="postgresql://user:pass@vps-ip:6432/database?..."
```

## Performance Checklist

Before deploying, verify:

- [x] Caching implemented (`src/lib/cache.ts`)
- [ ] `.env` has `connection_limit=20&pool_timeout=10`
- [ ] PostgreSQL `max_connections = 100` on VPS
- [ ] VPS firewall allows port 5432
- [ ] Cache stats endpoint works (`/api/cache-stats`)
- [ ] Load test passes with < 5% errors
- [ ] PM2 or process manager configured
- [ ] Monitoring in place (PM2 logs, cache stats)

## Quick Deploy Checklist

1. **On VPS:**

   ```bash
   # Update PostgreSQL config
   sudo nano /etc/postgresql/*/main/postgresql.conf
   # Set max_connections = 100, shared_buffers = 256MB
   sudo systemctl restart postgresql

   # Open firewall
   sudo ufw allow 5432/tcp
   ```

2. **On Laptop:**

   ```bash
   # Update .env with connection params
   # Build
   npm run build

   # Test
   npm start

   # Run load test
   autocannon -c 400 -d 60 http://localhost:3000/shop
   ```

3. **Monitor:**

   ```bash
   # Watch cache
   curl http://localhost:3000/api/cache-stats

   # If > 80% cache hits and < 5% errors = SUCCESS!
   ```

## Expected Performance Metrics

| Metric                 | Before  | After     |
| ---------------------- | ------- | --------- |
| Requests/sec           | 12      | 500-1000+ |
| Error rate (400 users) | 90%     | < 5%      |
| Database queries/min   | 10,000+ | 300-500   |
| Average latency        | 300ms   | 50-100ms  |
| Cache hit rate         | 0%      | 90-95%    |

Your website should now handle 1000+ concurrent users with minimal errors!
