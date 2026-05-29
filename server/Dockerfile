FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages ./packages
COPY server ./server

RUN pnpm install --filter @pomelo/code-gen --filter @pomelo/server
RUN pnpm --filter @pomelo/code-gen build

FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY --from=builder /app/packages /app/packages
COPY --from=builder /app/server /app/server

RUN pnpm install --filter @pomelo/server --prod

WORKDIR /app/server

ENV NODE_ENV=production
EXPOSE 8080

CMD ["pnpm", "start"]
