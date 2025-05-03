# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# 👇 Generate Prisma client before building
RUN npx prisma generate

# 👇 Then build the NestJS app
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
