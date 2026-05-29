FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# 1. Copy package files first to leverage Docker caching
COPY package.json pnpm-lock.yaml ./

# 2. Add --ignore-scripts to bypass the msw block and early svelte sync
RUN pnpm install --frozen-lockfile --ignore-scripts

# 3. Now copy the rest of your app source files
COPY . .

# 4. Manually run the sync now that svelte.config.js is inside the container
RUN pnpm exec svelte-kit sync
RUN pnpm build


FROM node:22-alpine AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

# 5. Use --ignore-scripts here too so it doesn't crash without source files
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Copy the built application from the builder stage
COPY --from=builder /app/build ./build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "build"]