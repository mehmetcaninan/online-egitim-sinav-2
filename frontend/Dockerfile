# Multi-stage build for React + Vite Frontend
FROM node:18-alpine as build

LABEL maintainer="Online Eğitim Sınav Sistemi - Frontend"

# Alpine'de gerekli build araçlarını yükle (ARM64 için)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat

# Çalışma dizinini ayarla
WORKDIR /app

# Package dosyalarını kopyala (dependency cache için)
COPY package*.json ./

# Node modules cache'i temizle ve yeniden yükle (ARM64 uyumlu)
RUN rm -rf node_modules package-lock.json && \
    npm cache clean --force && \
    npm install --verbose

# Kaynak kodları kopyala
COPY . .

# Environment variables for production build
ENV NODE_ENV=production
ENV VITE_API_BASE_URL=http://localhost:8084/api

# Production build oluştur
RUN npm run build

# Production stage - Nginx ile serve et
FROM nginx:alpine

# Nginx konfigürasyonu kopyala
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Build edilen dosyaları nginx'e kopyala
COPY --from=build /app/dist /usr/share/nginx/html

# Frontend port'u aç
EXPOSE 80

# Health check ekle
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Nginx'i başlat
CMD ["nginx", "-g", "daemon off;"]
