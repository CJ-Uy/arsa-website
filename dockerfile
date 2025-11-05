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

# Optimize Node.js memory and build performance
# Reduced from 4096 to 2048 for weaker servers
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Build Next.js (without Turbopack for stability)
# Add verbose logging to debug build issues
RUN npm run build 2>&1 | tee build.log || (cat build.log && exit 1)


# ---- Runner ----
# Production image, copy all the files and run next
FROM node:24-alpine AS runner
WORKDIR /app

# Install CA certificates for SSL/TLS support
RUN apk add --no-cache ca-certificates

# Set the environment to production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

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