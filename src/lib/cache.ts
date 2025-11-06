/**
 * In-memory cache for reducing database queries
 * Critical for remote database scenarios where network latency is high
 */

type CacheEntry<T> = {
	data: T;
	timestamp: number;
	ttl: number; // Time to live in milliseconds
};

class MemoryCache {
	private cache = new Map<string, CacheEntry<any>>();
	private cleanupInterval: NodeJS.Timeout;

	constructor() {
		// Clean up expired entries every 60 seconds
		this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
	}

	/**
	 * Get value from cache if it exists and hasn't expired
	 */
	get<T>(key: string): T | null {
		const entry = this.cache.get(key);
		if (!entry) return null;

		const now = Date.now();
		if (now - entry.timestamp > entry.ttl) {
			this.cache.delete(key);
			return null;
		}

		return entry.data as T;
	}

	/**
	 * Set value in cache with TTL
	 */
	set<T>(key: string, data: T, ttl: number): void {
		this.cache.set(key, {
			data,
			timestamp: Date.now(),
			ttl,
		});
	}

	/**
	 * Delete specific key from cache
	 */
	delete(key: string): void {
		this.cache.delete(key);
	}

	/**
	 * Delete all keys matching a pattern
	 */
	deletePattern(pattern: string): void {
		const regex = new RegExp(pattern);
		for (const key of this.cache.keys()) {
			if (regex.test(key)) {
				this.cache.delete(key);
			}
		}
	}

	/**
	 * Clear entire cache
	 */
	clear(): void {
		this.cache.clear();
	}

	/**
	 * Remove expired entries
	 */
	private cleanup(): void {
		const now = Date.now();
		for (const [key, entry] of this.cache.entries()) {
			if (now - entry.timestamp > entry.ttl) {
				this.cache.delete(key);
			}
		}
	}

	/**
	 * Get cache stats
	 */
	getStats() {
		return {
			size: this.cache.size,
			entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
				key,
				age: Date.now() - entry.timestamp,
				ttl: entry.ttl,
			})),
		};
	}

	/**
	 * Clean up on shutdown
	 */
	destroy(): void {
		clearInterval(this.cleanupInterval);
		this.cache.clear();
	}
}

// Singleton instance
export const cache = new MemoryCache();

// Helper function to wrap async functions with caching
export async function withCache<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
	// Try to get from cache first
	const cached = cache.get<T>(key);
	if (cached !== null) {
		return cached;
	}

	// Execute function and cache result
	const result = await fn();
	cache.set(key, result, ttl);
	return result;
}

// Cache key generators
export const cacheKeys = {
	products: (category?: string) => (category ? `products:category:${category}` : "products:all"),
	product: (id: string) => `product:${id}`,
	cart: (userId: string) => `cart:${userId}`,
	orders: (userId: string) => `orders:${userId}`,
	redirects: (code: string) => `redirect:${code}`,
	allRedirects: () => "redirects:all",
};
