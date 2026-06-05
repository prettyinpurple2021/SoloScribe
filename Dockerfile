FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY local_packages ./local_packages

RUN npm ci

COPY . .

RUN npm run build

ENV PORT=8080
EXPOSE 8080

CMD ["npm", "start"]
