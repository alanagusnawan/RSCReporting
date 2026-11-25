# Base node image
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate
WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/expression-engine/package.json ./packages/expression-engine/
COPY packages/report-schema/package.json ./packages/report-schema/
COPY packages/reporting-engine/package.json ./packages/reporting-engine/
COPY packages/takumi-renderer/package.json ./packages/takumi-renderer/

RUN pnpm install --frozen-lockfile

# Builder stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages ./packages
COPY . .

# Generate Prisma client
RUN pnpm --filter @rsc/api prisma:generate

# Build dependencies and API
RUN pnpm --filter @rsc/api build

# Production runner stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5488

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api ./apps/api

USER nestjs

EXPOSE 5488

WORKDIR /app/apps/api
CMD ["node", "dist/main.js"]
