# 1. Base image
FROM node:20-alpine

# 2. Set working directory
WORKDIR /app

# 3. Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# 4. Copy the rest of your app
COPY . .

# 5. Build the app
RUN npm run build

# 6. Expose port
EXPOSE 3000

# 7. Start the app
CMD ["node", "dist/main"]


# FROM node:20

# WORKDIR /app

# COPY package*.json prisma ./
# RUN npm install

# # Generate Prisma Client สำหรับ Linux ใน container
# RUN npx prisma generate

# COPY . .

# EXPOSE 3000

# CMD ["npm", "run", "start"]


