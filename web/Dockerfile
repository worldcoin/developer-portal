# from https://github.com/vercel/next.js/blob/474b115e6d903394d58a51eef97ffa4f2ae2ce70/examples/with-docker/Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN yarn build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Support for logging
# TODO: Improve this so we don't need to reinstall additional packages (600MB goes down to 200MB, plus faster build times)
RUN npm install next-logger@3.0.1 dd-trace@3.14.1 next@13.1.6
COPY --from=builder --chown=nextjs:nodejs /app/datadog.js ./datadog.js

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV NODE_OPTIONS='-r next-logger -r ./datadog.js'

CMD [ "node" , "server.js" ]
