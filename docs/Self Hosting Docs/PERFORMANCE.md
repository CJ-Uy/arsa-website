# Performance Optimization Guide

## Architecture Overview

This application is optimized for a **split architecture**:

- **Next.js Application**: Runs on a powerful laptop
- **PostgreSQL + MinIO**: Hosted on remote VPS

## Key Optimizations Implemented

### 1. **In-Memory Caching** (CRITICAL for Remote DB)

Located in `src/lib/cache.ts` - Implements aggressive caching to minimize database round trips.

**Cache TTLs:**

- Products: 30 seconds
- Cart: 10 seconds
- Page level: 5 minutes (300 seconds)

**Why this matters:**

- Every database query adds ~50-200ms network latency
- With 100 concurrent users, uncached = 10,000+ queries/minute
- With caching = ~300 queries/minute (97% reduction)

### 2. **Database Connection Pooling**

Located in `src/lib/prisma.ts`:

- Min connections: 5 (keeps connections warm)
- Max connections: 20 (handles bursts)
- Timeout: 10 seconds

**Configuration:**

```typescript
pool: {
  max: 20,      // Increase if you see "connection pool exhausted" errors
  min: 5,       // Decrease if DB server has connection limits
  timeout: 10,  // Increase if queries are slow
}
```

### 3. **Cache Invalidation**

Caches are automatically invalidated when data changes:

- Adding to cart → invalidates user's cart cache
- Updating cart → invalidates user's cart cache
- Creating order → invalidates user's cart cache
- Product changes → would need to invalidate product cache (add in admin actions)

### 4. **Performance Monitoring**

**API Endpoint:** `GET /api/cache-stats`

Returns:

```json
{
	"success": true,
	"stats": {
		"totalEntries": 15,
		"entries": [
			{
				"key": "products:all",
				"ageSeconds": 12,
				"ttlSeconds": 30,
				"expiresIn": 18
			}
		]
	}
}
```

Use this to monitor cache hit rates and adjust TTLs.

## Environment Variables

### Required for Optimal Performance

```bash
# Database connection string with connection pooling params
DATABASE_URL="postgresql://user:pass@your-vps:5432/db?connection_limit=20&pool_timeout=10"

# Node.js memory limit (increase for better caching)
NODE_OPTIONS="--max-old-space-size=4096"

# Enable production mode
NODE_ENV="production"
```

### PostgreSQL Configuration (on VPS)

Edit `/etc/postgresql/*/main/postgresql.conf`:

```conf
# Connection Settings
max_connections = 100              # Increase from default 50
shared_buffers = 256MB            # 25% of RAM
effective_cache_size = 1GB        # 50-75% of RAM
work_mem = 16MB                   # For sorting/hashing
maintenance_work_mem = 64MB

# Performance
random_page_cost = 1.1            # SSD optimized (default 4.0)
effective_io_concurrency = 200    # SSD optimized (default 1)

# Logging (for debugging slow queries)
log_min_duration_statement = 1000  # Log queries > 1s
```

Restart PostgreSQL: `sudo systemctl restart postgresql`

## Expected Performance

### Before Optimizations:

- **400 concurrent users**: 90% timeout rate
- **1000 concurrent users**: 97% error rate
- **Requests/sec**: 12.38

### After Optimizations (Estimated):

- **400 concurrent users**: < 1% error rate
- **1000 concurrent users**: < 5% error rate
- **Requests/sec**: 500-1000+
- **Database queries**: Reduced by 95-97%

## Load Testing Commands

```bash
# Test shop page with caching
autocannon -c 400 -d 60 http://localhost:3000/shop

# Test with 1000 connections
autocannon -c 1000 -d 60 http://localhost:3000/shop

# Monitor cache during load test
watch -n 1 'curl -s http://localhost:3000/api/cache-stats | jq'
```

## Monitoring Cache Performance

```bash
# View cache stats
curl http://localhost:3000/api/cache-stats | jq

# Clear cache (if needed)
curl -X DELETE http://localhost:3000/api/cache-stats

# Watch cache in real-time during load
watch -n 1 'curl -s http://localhost:3000/api/cache-stats | jq ".stats.totalEntries"'
```

## Tuning Cache TTLs

If you see high error rates, adjust TTLs in `src/app/shop/actions.ts`:

```typescript
// Increase cache time if products rarely change
const products = await withCache(
  cacheKeys.products(category),
  60000, // Increase to 60 seconds
  async () => { ... }
);

// Decrease cache time if cart data must be real-time
const cartItems = await withCache(
  cacheKeys.cart(session.user.id),
  5000, // Decrease to 5 seconds
  async () => { ... }
);
```

## Troubleshooting

### High Error Rates Still?

1. **Check VPS resources:**

   ```bash
   ssh your-vps
   htop  # Check CPU/RAM usage
   ```

2. **Check PostgreSQL connections:**

   ```sql
   SELECT count(*) FROM pg_stat_activity;
   SELECT max_connections FROM pg_settings WHERE name='max_connections';
   ```

3. **Increase connection pool:**
   - Edit `src/lib/prisma.ts`
   - Increase `max` to 50
   - Increase `max_connections` in PostgreSQL to 150

4. **Monitor slow queries:**
   ```bash
   tail -f /var/log/postgresql/postgresql-*.log | grep "duration"
   ```

### Cache Not Working?

1. **Check cache stats:**

   ```bash
   curl http://localhost:3000/api/cache-stats
   ```

2. **Verify imports:**

   ```typescript
   import { cache, cacheKeys, withCache } from "@/lib/cache";
   ```

3. **Check console for errors:**
   ```bash
   npm run dev
   # Look for cache-related errors
   ```

## Next Steps for Further Optimization

1. **Add Redis** (if VPS has capacity):
   - Install Redis on VPS
   - Replace in-memory cache with Redis
   - Benefit: Persistent cache across app restarts

2. **Enable CDN** (if you have static assets):
   - Use Cloudflare/Vercel CDN
   - Cache static pages at edge
   - Reduce load on your laptop

3. **Add Database Read Replicas** (advanced):
   - Set up PostgreSQL replication
   - Route reads to replica
   - Route writes to primary

4. **Implement Background Jobs**:
   - Use Bull/BullMQ for order processing
   - Offload heavy tasks from request cycle
   - Reduces perceived latency

## Performance Checklist

- [x] In-memory caching implemented
- [x] Database connection pooling optimized
- [x] Cache invalidation on mutations
- [x] Page-level caching (5 minutes)
- [x] Performance monitoring endpoint
- [ ] PostgreSQL configuration optimized (do manually on VPS)
- [ ] Load testing performed
- [ ] Cache TTLs tuned based on traffic
- [ ] Error monitoring set up (Sentry, etc.)
