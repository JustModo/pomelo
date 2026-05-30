FROM node:20-alpine

WORKDIR /app

COPY client/.next/standalone ./
COPY client/public ./client/public
COPY client/.next/static ./client/.next/static

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"


EXPOSE 3000

CMD ["node", "client/server.js"]
