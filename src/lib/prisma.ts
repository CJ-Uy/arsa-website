import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Optimized Prisma Client for remote database
// Connection pooling is configured via DATABASE_URL params:
// postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=10
export const prisma =
	globalForPrisma.prisma ||
	new PrismaClient({
		log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
	});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
