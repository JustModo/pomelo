FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages ./packages
COPY client ./client

ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_CLIENT_URL
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_CLIENT_URL=$NEXT_PUBLIC_CLIENT_URL

RUN pnpm install --filter @pomelo/client...
RUN pnpm --filter @pomelo/client build

FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY client ./client
COPY --from=builder /app/client/.next /app/client/.next
COPY --from=builder /app/client/public /app/client/public
COPY --from=builder /app/client/package.json /app/client/package.json

RUN pnpm install --filter @pomelo/client --prod

WORKDIR /app/client

ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_CLIENT_URL

ENV NODE_ENV=production
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_CLIENT_URL=$NEXT_PUBLIC_CLIENT_URL
EXPOSE 3000

CMD ["pnpm", "start"]
