import { NextResponse } from "next/server";
import { cache } from "@/lib/cache";

/**
 * GET /api/cache-stats
 * Returns cache statistics for monitoring performance
 */
export async function GET() {
	try {
		const stats = cache.getStats();

		return NextResponse.json({
			success: true,
			stats: {
				totalEntries: stats.size,
				entries: stats.entries.map((entry) => ({
					key: entry.key,
					ageSeconds: Math.round(entry.age / 1000),
					ttlSeconds: Math.round(entry.ttl / 1000),
					expiresIn: Math.round((entry.ttl - entry.age) / 1000),
				})),
			},
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		return NextResponse.json(
			{ success: false, error: "Failed to get cache stats" },
			{ status: 500 },
		);
	}
}

/**
 * DELETE /api/cache-stats
 * Clears the cache (useful for admin purposes)
 */
export async function DELETE() {
	try {
		cache.clear();
		return NextResponse.json({
			success: true,
			message: "Cache cleared successfully",
		});
	} catch (error) {
		return NextResponse.json({ success: false, error: "Failed to clear cache" }, { status: 500 });
	}
}
