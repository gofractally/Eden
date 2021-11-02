# Install dependencies only when needed
FROM node:lts-alpine AS deps

RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

COPY package.json yarn.lock ./
COPY ./packages/common/package.json ./packages/common/
COPY ./packages/eden-subchain-client/package.json ./packages/eden-subchain-client/
COPY ./packages/box/package.json ./packages/box/

RUN yarn install --frozen-lockfile

# Rebuild the source code only when needed
FROM node:lts-alpine AS builder
WORKDIR /app

COPY ./packages/common ./packages/common
COPY ./packages/eden-subchain-client ./packages/eden-subchain-client
COPY ./packages/box ./packages/box
COPY .eslintignore .eslintrc.js .prettierrc.json lerna.json package.json tsconfig.build.json tsconfig.json yarn.lock ./

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/common/node_modules ./packages/common/node_modules
COPY --from=deps /app/packages/box/node_modules ./packages/box/node_modules
COPY ./build/eden-micro-chain.wasm /app/build/

RUN yarn build --stream

# Production image, copy all the files and run next
FROM node:lts-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# You only need to copy next.config.js if you are NOT using the default configuration
COPY --from=builder /app .

RUN addgroup -g 1001 -S nodejs
RUN adduser -S box -u 1001
RUN chown -R box:nodejs /app
USER box

EXPOSE 3032

CMD ["yarn", "start", "--stream"]
