FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# PostHog analytics config (inlined into the client bundle at build time by Vite).
# These VITE_PUBLIC_* values are public client-side keys and .env is excluded from
# the build context via .dockerignore, so they are set here for the production build.
ENV VITE_PUBLIC_POSTHOG_KEY=phc_CwXUQjusQePk4RTj7YeEvJSsPfchPnxsPAaQiAew3yR9
ENV VITE_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Build the fullstack app (outputs to dist/)
RUN npm run build

# Serve stage
FROM node:20-alpine

WORKDIR /app

# Copy the built code and dependencies
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

ENV PORT=8080
ENV NODE_ENV=production
EXPOSE 8080

CMD ["npm", "start"]
