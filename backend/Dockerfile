FROM node:20-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run prisma:generate
RUN npm run build

FROM node:20-bookworm-slim AS runtime
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps /app/dist ./dist
COPY --from=deps /app/src/prisma ./src/prisma
EXPOSE 3000
CMD ["sh", "-c", "npx prisma db push --schema src/prisma/schema.prisma && npm run seed:prod && node dist/server.js"]
