# Builder
FROM node:20-bullseye AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runner – tiny + working on GCP
FROM node:20-slim AS runner
WORKDIR /app

# Fix "python was not found" on Cloud Build
RUN apt-get update && apt-get install -y python3 && ln -s /usr/bin/python3 /usr/bin/python && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Minimal deps for @sparticuz/chromium
RUN apt-get update && apt-get install -y \
    ca-certificates fonts-liberation libnss3 libatk-bridge2.0-0 libatk1.0-0 \
    libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 libasound2 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]