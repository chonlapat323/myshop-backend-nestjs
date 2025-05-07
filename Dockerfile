# Step 1: Build dependencies
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm install

# Step 2: Build source code
FROM node:20-alpine AS builder
WORKDIR /app

COPY public ./public
COPY src ./src
COPY prisma ./prisma
COPY types ./types
COPY utils ./utils
COPY nest-cli.json ./
COPY tsconfig*.json ./
COPY package.json ./
COPY .env .env
COPY --from=deps /app/node_modules ./node_modules

RUN npx prisma generate
RUN npx prisma migrate deploy

RUN npm run build

# Step 3: Create production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# ✅ Copy only required files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "dist/src/main.js"]
