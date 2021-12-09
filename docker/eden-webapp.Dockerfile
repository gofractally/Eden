# Install dependencies only when needed
FROM node:lts-alpine AS deps

RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

COPY package.json yarn.lock ./
COPY ./packages/common/package.json ./packages/common/
COPY ./packages/eden-subchain-client/package.json ./packages/eden-subchain-client/
COPY ./packages/webapp/package.json ./packages/webapp/

RUN yarn install --frozen-lockfile

# Rebuild the source code only when needed
FROM node:lts-alpine AS builder
WORKDIR /app

COPY ./packages/common ./packages/common
COPY ./packages/eden-subchain-client ./packages/eden-subchain-client
COPY ./packages/webapp ./packages/webapp
COPY .eslintignore .eslintrc.js .prettierrc.json lerna.json package.json tsconfig.build.json tsconfig.json yarn.lock ./

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/common/node_modules ./packages/common/node_modules
COPY --from=deps /app/packages/webapp/node_modules ./packages/webapp/node_modules

RUN yarn build --stream

# Production image, copy all the files and run next
FROM node:lts-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# You only need to copy next.config.js if you are NOT using the default configuration
COPY --from=builder /app .

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry.
# RUN npx next telemetry disable
CMD ["yarn", "start", "--stream"]
