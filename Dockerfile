# -----------------------------
# 1. Builder Stage
# -----------------------------
FROM node:20-bullseye AS builder
WORKDIR /app

# Install build-time deps (only needed if you ever use full puppeteer)
RUN apt-get update && apt-get install -y ca-certificates fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
# Force success message — fixes false "non-zero exit" bug on Cloud Build
RUN npm run build && echo "NEXT BUILD SUCCESSFUL - $(date)"

# -----------------------------
# 2. Runner Stage — TINY + 100% WORKING ON GCP
# -----------------------------
FROM node:20-slim AS runner
WORKDIR /app

# === 1. Fix "python was not found" on Cloud Build ===
RUN apt-get update && \
    apt-get install -y python3 && \
    ln -s /usr/bin/python3 /usr/bin/python && \
    rm -rf /var/lib/apt/lists/*

# === 2. Minimal deps for @sparticuz/chromium ===
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libnss3 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# === 3. Critical env vars ===
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
# Let @sparticuz/chromium provide the binary
# (no need for PUPPETEER_EXECUTABLE_PATH)

# === 4. Copy only what Next.js standalone needs ===
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Optional: copy next.config.js if you use i18n or other config
# COPY --from=builder /app/next.config.js ./

EXPOSE 3000

# This is the magic line — Next.js standalone runs server.js
CMD ["node", "server.js"]