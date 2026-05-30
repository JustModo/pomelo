FROM node:20-alpine

WORKDIR /app

COPY server/dist/index.js ./index.js

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "index.js"]
