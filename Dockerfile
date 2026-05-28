FROM node:22-alpine AS base

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

RUN pnpm install --frozen-lockfile

COPY . .

ARG DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder?sslmode=require"
ENV DATABASE_URL=$DATABASE_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

ENV NODE_ENV=production

EXPOSE 3000

CMD ["pnpm", "start"]
