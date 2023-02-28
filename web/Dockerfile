# from https://github.com/vercel/next.js/blob/474b115e6d903394d58a51eef97ffa4f2ae2ce70/examples/with-docker/Dockerfile
FROM --platform=linux/amd64 node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS runner
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
WORKDIR /app
RUN chown -R nextjs:nodejs /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# TODO: Leverage Next.JS standalone output to significantly reduce image size
RUN yarn build

USER nextjs

EXPOSE 3000

CMD [ "yarn" , "start" ]