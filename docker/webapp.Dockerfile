# Install dependencies only when needed
FROM node:alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

COPY package.json yarn.lock ./
COPY ./packages/webapp/package.json ./packages/webapp/

RUN yarn install --frozen-lockfile

# Rebuild the source code only when needed
FROM node:alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN yarn build --stream

# Production image, copy all the files and run next
FROM node:alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# You only need to copy next.config.js if you are NOT using the default configuration
COPY --from=builder /app/packages/webapp ./packages/webapp
# COPY --from=builder /app/packages/webapp/node_modules/* ./node_modules/*
COPY --from=builder /app/package.json ./package.json

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
RUN chown -R nextjs:nodejs /app/packages/webapp/dist
USER nextjs

EXPOSE 3000

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry.
# RUN npx next telemetry disable
WORKDIR /app/packages/webapp
CMD ["yarn", "start"]
