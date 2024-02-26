# This Dockerfile is used to build the production image
# from https://github.com/vercel/next.js/blob/474b115e6d903394d58a51eef97ffa4f2ae2ce70/examples/with-docker/Dockerfile
FROM --platform=linux/amd64 node:18-alpine AS base
RUN wget -qO /bin/pnpm "https://github.com/pnpm/pnpm/releases/latest/download/pnpm-linuxstatic-x64" && chmod +x /bin/pnpm

# Install dependencies only when needed
FROM base AS deps
RUN apk upgrade
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS runner

# Temporary env vars required for building
ARG ASSETS_S3_BUCKET_NAME=""
ARG ASSETS_S3_REGION=""
ARG NEXT_PUBLIC_VERIFIED_IMAGES_CDN_URL=""
ENV ASSETS_S3_BUCKET_NAME=${ASSETS_S3_BUCKET_NAME}
ENV ASSETS_S3_REGION=${ASSETS_S3_REGION}
ENV NEXT_PUBLIC_VERIFIED_IMAGES_CDN_URL=${NEXT_PUBLIC_VERIFIED_IMAGES_CDN_URL}
ENV GENERAL_SECRET_KEY unsafe_test_key
ENV HASURA_GRAPHQL_JWT_SECRET '{"key": "unsafe_AnEsZxveGsAWoENHGAnEsZxveGsAvxgMtDq9UxgTsDq9UxgTsNHGWoENIoJ", "type": "HS512"}'
ENV JWT_ISSUER invalid.localhost

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
WORKDIR /app
RUN chown -R nextjs:nodejs /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# TODO: Leverage Next.JS standalone output to significantly reduce image size
RUN pnpm build

# Change ownership of the .next directory to nextjs user
RUN chown -R nextjs:nodejs /app/.next

USER nextjs

EXPOSE 3000

CMD [ "pnpm" , "start" ]
