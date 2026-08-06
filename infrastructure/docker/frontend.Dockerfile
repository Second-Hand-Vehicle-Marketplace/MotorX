FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/worker/package.json ./apps/worker/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared-contracts/package.json ./packages/shared-contracts/

RUN npm install

COPY packages/shared-contracts ./packages/shared-contracts
COPY apps/frontend ./apps/frontend

RUN npm run build --workspace @motorx/shared-contracts

WORKDIR /app/apps/frontend

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
