/**
 * Cloudflare KV-backed cache.
 * Replaces the previous in-memory Map cache, which does not survive across Worker isolates.
 *
 * KV semantics:
 *   - Eventually consistent across edge locations (writes may take ~60s to fan out).
 *   - TTL handled by KV itself via expirationTtl on put.
 */

import { getCloudflareContext } from "@opennextjs/cloudflare";

function getKv(): KVNamespace | null {
	try {
		const ctx = getCloudflareContext();
		return (ctx.env as unknown as { CACHE?: KVNamespace }).CACHE ?? null;
	} catch {
		return null;
	}
}

const inflightRequests = new Map<string, Promise<unknown>>();

class KvCache {
	async get<T>(key: string): Promise<T | null> {
		const kv = getKv();
		if (!kv) return null;
		return (await kv.get<T>(key, "json")) ?? null;
	}

	async set<T>(key: string, data: T, ttlMs: number): Promise<void> {
		const kv = getKv();
		if (!kv) return;
		const ttlSeconds = Math.max(60, Math.floor(ttlMs / 1000));
		await kv.put(key, JSON.stringify(data), { expirationTtl: ttlSeconds });
	}

	async delete(key: string): Promise<void> {
		const kv = getKv();
		if (!kv) return;
		await kv.delete(key);
	}

	async deletePattern(_pattern: string): Promise<void> {
		// KV doesn't support pattern delete cheaply. Callers should track keys explicitly.
		// For migration, this is a no-op; caches expire via TTL.
	}

	async clear(): Promise<void> {
		// Same as above — KV requires enumeration. Skipped.
	}

	async getStats(): Promise<{ size: number }> {
		return { size: 0 };
	}
}

export const cache = new KvCache();

export async function withCache<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
	const cached = await cache.get<T>(key);
	if (cached !== null) return cached;

	const existing = inflightRequests.get(key);
	if (existing) return existing as Promise<T>;

	const request = fn()
		.then(async (result) => {
			await cache.set(key, result, ttlMs);
			inflightRequests.delete(key);
			return result;
		})
		.catch((error) => {
			inflightRequests.delete(key);
			throw error;
		});

	inflightRequests.set(key, request);
	return request;
}

export const cacheKeys = {
	products: (category?: string) => (category ? `products:category:${category}` : "products:all"),
	product: (id: string) => `product:${id}`,
	cart: (userId: string) => `cart:${userId}`,
	orders: (userId: string) => `orders:${userId}`,
	redirects: (code: string) => `redirect:${code}`,
	allRedirects: () => "redirects:all",
};
