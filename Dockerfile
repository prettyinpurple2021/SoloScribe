FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY local_packages ./local_packages

RUN npm ci

COPY . .

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

RUN npm install -g serve@14.2.6

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["sh", "-c", "serve -s dist -l ${PORT:-8080}"]
