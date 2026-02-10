FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends chromium ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

RUN npm run db:generate
RUN npm run build

ENV NODE_ENV=production

EXPOSE 3001

CMD ["sh", "-c", "npm run db:migrate && npm run start:prod"]
