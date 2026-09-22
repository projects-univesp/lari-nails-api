# Stage 1: Build
FROM cgr.dev/chainguard/node:latest AS build
WORKDIR /build

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci

COPY --chown=node:node prisma.config.ts ./
COPY --chown=node:node prisma ./prisma
RUN npx prisma generate

COPY --chown=node:node . .
RUN npm run build
RUN npm ci --omit=dev && npm cache clean --force
RUN npx prisma generate

# Stage 2: Distroless Runtime
FROM gcr.io/distroless/nodejs24-debian13:latest
WORKDIR /app

COPY --from=build /build/node_modules ./node_modules
COPY --from=build /build/dist ./dist
COPY --from=build /build/prisma ./prisma
COPY --from=build /build/prisma.config.ts ./prisma.config.ts
COPY --from=build /build/package.json ./package.json

EXPOSE 3000
CMD [ "dist/main.js" ]
