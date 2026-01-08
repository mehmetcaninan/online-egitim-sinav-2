#!/bin/bash

echo "🐳 Docker Container'ları Başlatılıyor..."
echo "======================================"

# Docker Compose ile servisleri başlat
echo "📦 Tüm servisleri başlatıyor..."
docker-compose up -d

echo ""
echo "⏳ Servislerin hazır olması bekleniyor..."
sleep 10

echo ""
echo "🔍 Servis durumları:"
docker-compose ps

echo ""
echo "📋 Çalışan container'lar:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🌐 Erişim bilgileri:"
echo "  • Backend: http://localhost:8081"
echo "  • PostgreSQL: localhost:5432"
echo "  • Selenium Hub: http://localhost:4444"

echo ""
echo "📊 Container logları için:"
echo "  docker-compose logs -f app        # Backend logs"
echo "  docker-compose logs -f db         # Database logs"
echo "  docker-compose logs -f selenium-hub  # Selenium logs"

echo ""
echo "🛑 Durdurmak için:"
echo "  docker-compose down"
