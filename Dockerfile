# Stage 1: Build
FROM oven/bun:1-alpine AS builder
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --linker hoisted

COPY tsconfig*.json nest-cli.json ./
COPY src ./src

RUN bun run build

# Stage 2: Production Runner
FROM oven/bun:1-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY package.json bun.lock* ./
RUN bun install --production --linker hoisted

COPY --from=builder /app/dist ./dist

USER bun
EXPOSE 4000

CMD ["bun", "dist/main.js"]
