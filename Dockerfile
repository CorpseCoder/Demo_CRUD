FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
ENV NODE_ENV=production

CMD ["sh", "-c", "./node_modules/.bin/drizzle-kit migrate && npm start"]
