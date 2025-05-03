# 1. Base image
FROM node:20-alpine

# 2. Set working directory
WORKDIR /app

# 3. Copy package files
COPY package*.json ./

# 4. Install dependencies
RUN npm install

# 5. Copy source code
COPY . .

# ✅ 6. Generate Prisma client
RUN npx prisma generate

# 7. Build NestJS
RUN npm run build

# 8. Expose port
EXPOSE 3000

# 9. Start app
CMD ["node", "dist/src/main.js"]



# FROM node:20

# WORKDIR /app

# COPY package*.json prisma ./
# RUN npm install

# # Generate Prisma Client สำหรับ Linux ใน container
# RUN npx prisma generate

# COPY . .

# EXPOSE 3000

# CMD ["npm", "run", "start"]


