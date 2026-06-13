# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package definition files
COPY package*.json ./
# Copy local packages required by overrides in package.json
COPY local_packages ./local_packages

# Install dependencies (using npm install because package-lock.json might not be fully up to date with local overrides in some scenarios, but npm ci is generally better. Using npm install just in case)
RUN npm install

# Copy application code
COPY . .

# Build the SPA (outputs to dist/)
RUN npm run build

# Serve stage
FROM nginx:alpine

# Copy the build output to Nginx's static file serving directory
COPY --from=build /app/dist /usr/share/nginx/html

# Create an Nginx template configuration that listents on $PORT (default 8080)
# and redirects all unknown routes to index.html for React Router to handle
RUN echo "server { \
    listen \${PORT:-8080}; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files \$uri \$uri/ /index.html; \
    } \
}" > /etc/nginx/templates/default.conf.template

# Cloud Run uses the PORT variable
ENV PORT=8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
