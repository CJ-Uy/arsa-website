FROM node:24-alpine AS base
WORKDIR /app

# ---- Dependencies ----
# Install dependencies in a separate layer to leverage Docker's caching.
# This layer is only rebuilt when package.json or package-lock.json changes.
FROM base AS deps
# Install libc6-compat for compatibility with native modules
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json* ./
# Install ALL dependencies (including devDependencies) needed for build
# Also install @next/swc-linux-x64-musl specifically for Alpine
RUN npm ci && \
    npm cache clean --force

# Install the Alpine-compatible SWC binary
RUN npm install --no-save @next/swc-linux-x64-musl


# ---- Prisma Generator ----
# Separate stage for Prisma generation to leverage caching
FROM base AS prisma
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* ./
# Only copy Prisma schema for better caching
COPY prisma ./prisma
RUN npx prisma generate


# ---- Builder ----
# Rebuild the source code only when needed
FROM base AS builder
# Copy dependencies (includes Prisma client after generation)
COPY --from=prisma /app/node_modules ./node_modules

# Copy application source
COPY . .

# Copy the generated Prisma client from prisma stage
COPY --from=prisma /app/src/generated ./src/generated

# Set environment to production for optimal build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Provide a dummy DATABASE_URL for build time (won't actually connect to DB during build)
# This is needed because Prisma client requires DATABASE_URL to be set
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"

# Optimize Node.js memory and build performance
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Build Next.js with Turbopack
RUN npm run build


# ---- Runner ----
# Production image, copy all the files and run next
FROM node:24-alpine AS runner
WORKDIR /app

# Install CA certificates for SSL/TLS support
RUN apk add --no-cache ca-certificates

# Set the environment to production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Disable SSL certificate verification for self-signed certificates
# This is needed for MinIO/S3 storage with self-signed SSL certs
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

# Create a non-root user for security best practices (combine RUN commands to reduce layers)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy the standalone output from the builder stage.
# Note: Next.js standalone mode includes necessary node_modules in the output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma client for runtime (generated client is in custom location)
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated

# Switch to the non-root user
USER nextjs

# Expose the port the app will run on
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# The command to start the production server
CMD ["node", "server.js"]