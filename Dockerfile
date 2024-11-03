# Build frontend
FROM node:18-alpine as frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Final stage
FROM node:18-slim
WORKDIR /app

# Install nginx
RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

# Copy backend dependencies and code
COPY package*.json ./
COPY server.js ./
RUN npm install --production

# Copy frontend build from frontend-builder
COPY --from=frontend-builder /app/build ./public

# Configure nginx
RUN echo 'server { \
    listen 3000; \
    location / { \
        root /app/public; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    location /api { \
        proxy_pass http://localhost:3001; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_cache_bypass $http_upgrade; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Create start script
RUN echo '#!/bin/bash \n\
nginx \n\
node server.js' > /app/start.sh && chmod +x /app/start.sh

# Environment variables
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3000

CMD ["/app/start.sh"]
