FROM node:20-alpine

WORKDIR /app

COPY client/.next/standalone ./
COPY client/public ./client/public
COPY client/.next/static ./client/.next/static

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"

ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_CLIENT_URL
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_CLIENT_URL=$NEXT_PUBLIC_CLIENT_URL
EXPOSE 3000

CMD ["node", "client/server.js"]
