#!/bin/bash

echo "Backend yeniden başlatılıyor..."
echo ""

# Veritabanını kullanan tüm Java süreçlerini bul ve durdur
echo "Veritabanını kullanan süreçler aranıyor..."
DB_PIDS=$(lsof 2>/dev/null | grep "online_egitim_db" | awk '{print $2}' | sort -u)
if [ ! -z "$DB_PIDS" ]; then
    echo "Veritabanını kullanan süreçler bulundu, durduruluyor..."
    echo "$DB_PIDS" | xargs kill -9 2>/dev/null
    sleep 2
    echo "✓ Veritabanı bağlantıları kapatıldı"
fi

# Port 8081'de çalışan süreçleri bul ve durdur
PORT_PID=$(lsof -ti:8081 2>/dev/null)
if [ ! -z "$PORT_PID" ]; then
    echo "Port 8081'de çalışan süreç bulundu (PID: $PORT_PID), durduruluyor..."
    kill -9 $PORT_PID 2>/dev/null
    sleep 2
    echo "✓ Port 8081 temizlendi"
fi

# Çalışan Spring Boot jar süreçlerini bul ve durdur
SPRING_PIDS=$(ps aux | grep "online_egitim_sinav_kod.*\.jar" | grep -v grep | awk '{print $2}')
if [ ! -z "$SPRING_PIDS" ]; then
    echo "Çalışan Spring Boot süreçleri bulundu, durduruluyor..."
    echo "$SPRING_PIDS" | xargs kill -9 2>/dev/null
    sleep 1
    echo "✓ Eski Spring Boot süreçleri durduruldu"
fi

# IntelliJ IDEA veritabanı bağlantılarını kapat
IDEA_DB_PIDS=$(ps aux | grep "RemoteJdbcServer" | grep -v grep | awk '{print $2}')
if [ ! -z "$IDEA_DB_PIDS" ]; then
    echo "IntelliJ IDEA veritabanı bağlantıları bulundu, durduruluyor..."
    echo "$IDEA_DB_PIDS" | xargs kill -9 2>/dev/null
    sleep 1
    echo "✓ IntelliJ IDEA veritabanı bağlantıları kapatıldı"
fi

echo ""
echo "Veritabanı dosyaları temizleniyor..."

# Veritabanı kilit dosyasını sil
rm -f data/online_egitim_db.mv.db.lock 2>/dev/null
rm -f data/*.lock 2>/dev/null
echo "✓ Kilit dosyaları silindi"

# Eğer sorun devam ederse, veritabanını yedekle ve yeniden oluştur
if [ -f "data/online_egitim_db.mv.db" ]; then
    echo "Veritabanı dosyası mevcut, yedekleniyor..."
    cp data/online_egitim_db.mv.db data/online_egitim_db.mv.db.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null
fi

echo ""
echo "Backend başlatılıyor..."
echo "Lütfen bekleyin..."
echo ""
echo "NOT: IntelliJ IDEA'da Database Tools penceresini kapatın!"
echo "NOT: H2 Console'u kapatın!"
echo ""

# Backend'i başlat
./mvnw spring-boot:run
