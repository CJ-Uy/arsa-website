FROM node:24-alpine AS base
WORKDIR /app

# ---- Dependencies ----
# Install dependencies in a separate layer to leverage Docker's caching.
# This layer is only rebuilt when package.json or package-lock.json changes.
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci


# ---- Builder ----
# This stage builds the actual application.
FROM base AS builder
# Copy dependencies from the 'deps' stage
COPY --from=deps /app/node_modules ./node_modules
# Copy the rest of your application code
COPY . .

# Generate the Prisma client based on your schema
# This is a critical step!
RUN npx prisma generate

# Build the Next.js application for production
RUN npm run build


# ---- Runner ----
# This is the final, small production image.
FROM node:18-alpine AS runner
WORKDIR /app

# Set the environment to production
ENV NODE_ENV=production

# Create a non-root user for security best practices
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone output from the builder stage.
# These are the only files needed to run the app.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to the non-root user
USER nextjs

# Expose the port the app will run on. This is read from the ENV variable.
# The default is 3000, but Coolify will set this from your .env.
EXPOSE 3000
ENV PORT=3000

# The command to start the production server
CMD ["node", "server.js"]