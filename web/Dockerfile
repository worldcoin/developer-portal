# https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile
FROM --platform=linux/amd64 public.ecr.aws/docker/library/node:20.15.1-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk update && apk add --no-cache libc6-compat
WORKDIR /app

# Install working version of corepack
RUN npm install -g corepack@0.31.0 && corepack --version

# Install dependencies based on the preferred package manager
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm i --frozen-lockfile

# Server depencies are runtime depencies required for running the Node.JS server, bundled separately
# this includes logging dependencies
FROM base AS server_deps
WORKDIR /app

# Install working version of corepack
RUN npm install -g corepack@0.31.0 && corepack --version

# TODO: Can be further optimized to remove next peer dependency
RUN corepack enable pnpm && pnpm i next-logger@5.0.0 pino@9.2.0 dd-trace@5.12.0

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Install working version of corepack
RUN npm install -g corepack@0.31.0 && corepack --version

# Temporary env vars required for building
ARG ASSETS_S3_BUCKET_NAME=""
ARG ASSETS_S3_REGION=""
ARG NEXT_PUBLIC_IMAGES_CDN_URL=""
ARG NEXT_PUBLIC_APP_URL=""
ARG NEXT_PUBLIC_POSTHOG_API_KEY=""
ARG CLOUDFRONT_DISTRIBUTION_ID=""
ARG NEXT_PUBLIC_APP_ENV=""
ENV NEXT_PUBLIC_APP_ENV=${NEXT_PUBLIC_APP_ENV}
ENV ASSETS_S3_BUCKET_NAME=${ASSETS_S3_BUCKET_NAME}
ENV ASSETS_S3_REGION=${ASSETS_S3_REGION}
ENV NEXT_PUBLIC_IMAGES_CDN_URL=${NEXT_PUBLIC_IMAGES_CDN_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_POSTHOG_API_KEY=${NEXT_PUBLIC_POSTHOG_API_KEY}
ENV GENERAL_SECRET_KEY=unsafe_test_key
ENV HASURA_GRAPHQL_JWT_SECRET='{"key": "unsafe_AnEsZxveGsAWoENHGAnEsZxveGsAvxgMtDq9UxgTsDq9UxgTsNHGWoENIoJ", "type": "HS512"}'
ENV CLOUDFRONT_DISTRIBUTION_ID=${CLOUDFRONT_DISTRIBUTION_ID}
ENV JWT_ISSUER=invalid.localhost

RUN corepack enable pnpm && pnpm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=server_deps --chown=nextjs:nodejs /app/node_modules/. ./node_modules/.
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Source maps are enabled to provide helpful error stacks
ENV NODE_OPTIONS='--enable-source-maps -r dd-trace -r next-logger'
ENV NODE_ENV=production

# Final config
USER nextjs

EXPOSE 3000

ENV PORT=3000
# set hostname to localhost
ENV HOSTNAME="0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]
