# Stage 1: Build the React/Vite application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the application (output goes to /app/dist)
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:stable-alpine

# Remove the default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy the built assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy a custom nginx config to handle SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
