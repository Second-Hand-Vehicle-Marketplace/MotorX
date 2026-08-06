FROM node:20-alpine

WORKDIR /app

# Copy workspace manifests first for better layer caching
COPY package.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/worker/package.json ./apps/worker/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared-contracts/package.json ./packages/shared-contracts/

RUN npm install

# Copy source
COPY packages/shared-contracts ./packages/shared-contracts
COPY apps/backend ./apps/backend

RUN npm run build --workspace @motorx/shared-contracts
RUN npm run build --workspace @motorx/backend

WORKDIR /app/apps/backend

EXPOSE 3000

CMD ["node", "dist/server.js"]
