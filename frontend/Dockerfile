FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache libc6-compat build-base vips-dev
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]