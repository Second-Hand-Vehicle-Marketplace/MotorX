# =========================================================
# Stage 1: build
# Installs every dependency (including TypeScript and test tools)
# and compiles the worker. Nothing from this stage ships to
# production except the compiled dist/ folders.
# =========================================================
FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/worker/package.json ./apps/worker/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared-contracts/package.json ./packages/shared-contracts/

RUN npm ci

COPY packages/shared-contracts ./packages/shared-contracts
COPY apps/worker ./apps/worker

RUN npm run build --workspace @motorx/shared-contracts \
 && npm run build --workspace @motorx/worker \
 && find apps/worker/dist -name '*.test.js' -delete

# =========================================================
# Stage 2: development (used by compose.dev.yml, compose.watch.yml, compose.test.yml)
# Keeps the dev dependencies (tsx, Vitest). Never deployed.
# =========================================================
FROM build AS development

WORKDIR /app/apps/worker

CMD ["npm", "run", "dev"]

# =========================================================
# Stage 3: runtime (the default target, deployed to production)
# Only the worker's production dependencies plus compiled code.
# =========================================================
FROM node:24-alpine AS runtime

ENV NODE_ENV=production

# Apply Alpine security fixes released since the base image was published.
RUN apk upgrade --no-cache

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/worker/package.json ./apps/worker/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared-contracts/package.json ./packages/shared-contracts/

# Package managers are only needed to install; removing them from the runtime
# image leaves less for an attacker to use and less for scanners to flag.
RUN npm ci --omit=dev --workspace @motorx/worker \
 && npm cache clean --force \
 && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
    /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
    /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-* /root/.npm

COPY --from=build /app/packages/shared-contracts/dist ./packages/shared-contracts/dist
COPY --from=build /app/apps/worker/dist ./apps/worker/dist

WORKDIR /app/apps/worker

USER node

CMD ["node", "dist/worker.js"]
