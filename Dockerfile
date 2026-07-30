# syntax=docker/dockerfile:1.6
# Multi-stage build for the e-resi Next.js frontend (Nx monorepo, apps/web).

ARG NODE_VERSION=22.11.0-alpine

# ─── deps ────────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS deps
WORKDIR /repo
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@10
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages ./packages
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ─── build ───────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS build
WORKDIR /repo
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@10
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/web/node_modules ./apps/web/node_modules
COPY . .
# NEXT_PUBLIC_* bake into the client bundle here; the deploy workflow feeds
# them as build args. Set placeholders so pnpm build never fails on unset.
ARG NEXT_PUBLIC_API_URL=https://api.e-resi.co.ke
ARG NEXT_PUBLIC_APP_URL=https://app.e-resi.co.ke
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm nx build web --configuration=production

# ─── runtime ─────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN apk add --no-cache tini \
    && addgroup -S nextjs && adduser -S nextjs -G nextjs -u 1001
# Next standalone output preserves the monorepo layout under .next/standalone/
# (node_modules at root + apps/web/server.js + apps/web/.next). Copy the
# whole tree, then re-drop static + public which standalone doesn't include.
COPY --from=build --chown=nextjs:nextjs /repo/apps/web/.next/standalone ./
COPY --from=build --chown=nextjs:nextjs /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=nextjs:nextjs /repo/apps/web/public ./apps/web/public
USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
ENTRYPOINT ["/sbin/tini","--"]
CMD ["node","apps/web/server.js"]
