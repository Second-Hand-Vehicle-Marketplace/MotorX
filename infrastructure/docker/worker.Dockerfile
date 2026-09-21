FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/worker/package.json ./apps/worker/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared-contracts/package.json ./packages/shared-contracts/

RUN npm ci

COPY packages/shared-contracts ./packages/shared-contracts
COPY apps/worker ./apps/worker

RUN npm run build --workspace @motorx/shared-contracts
RUN npm run build --workspace @motorx/worker

WORKDIR /app/apps/worker

USER node

CMD ["node", "dist/worker.js"]
