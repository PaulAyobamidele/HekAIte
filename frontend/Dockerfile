# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Set API base URL for production build
ENV NEXT_PUBLIC_API_URL=/api/v1

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built static export
COPY --from=builder /app/.next/standalone /app
COPY --from=builder /app/.next/static /app/.next/static
COPY --from=builder /app/public /app/public

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
