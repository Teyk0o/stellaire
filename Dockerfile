FROM node:22-slim AS base
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS deps
COPY package.json ./
RUN npm install

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p content
RUN npx next build

FROM node:22-slim AS runner
ENV NODE_ENV=production
RUN groupadd --system --gid 1001 stellaire && useradd --system --uid 1001 -g stellaire stellaire

WORKDIR /app
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

RUN mkdir -p /app/data /app/content && chown -R stellaire:stellaire /app/data /app/content
VOLUME ["/app/data", "/app/content"]

USER stellaire
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
