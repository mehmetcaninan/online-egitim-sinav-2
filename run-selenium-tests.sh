#!/bin/bash

echo "🚀 Selenium Testlerini Çalıştırma Scripti"
echo "=========================================="

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}1. Backend durumu kontrol ediliyor...${NC}"
if curl -s http://localhost:8081 > /dev/null; then
    echo -e "${GREEN}✅ Backend localhost:8081'de çalışıyor${NC}"
else
    echo -e "${RED}❌ Backend localhost:8081'de çalışmıyor${NC}"
    echo -e "${YELLOW}Backend'i başlatmak için: mvn spring-boot:run${NC}"
fi

echo -e "${YELLOW}2. Frontend durumu kontrol ediliyor...${NC}"
if curl -s http://localhost:5173 > /dev/null; then
    echo -e "${GREEN}✅ Frontend localhost:5173'te çalışıyor${NC}"
else
    echo -e "${RED}❌ Frontend localhost:5173'te çalışmıyor${NC}"
    echo -e "${YELLOW}Frontend'i başlatmak için: cd frontend && npm run dev${NC}"
fi

echo -e "${YELLOW}3. Chrome WebDriver kontrol ediliyor...${NC}"
if command -v google-chrome &> /dev/null || command -v chromium-browser &> /dev/null; then
    echo -e "${GREEN}✅ Chrome tarayıcısı bulundu${NC}"
else
    echo -e "${RED}❌ Chrome tarayıcısı bulunamadı${NC}"
    echo "Selenium testleri Chrome WebDriver kullanır"
fi

echo -e "${YELLOW}4. Maven bağımlılıkları kontrol ediliyor...${NC}"
./mvnw dependency:resolve -q

echo -e "${YELLOW}5. Test derleme işlemi...${NC}"
./mvnw test-compile

echo -e "${YELLOW}6. Kapsamlı Selenium testleri çalıştırılıyor...${NC}"
echo "Not: Testler Maven Failsafe plugin ile entegrasyon test fazında çalışır"
echo -e "${GREEN}Şu testler çalışacak:${NC}"
echo "  • UserLogin testleri (Temel giriş)"
echo "  • AdminPanel testleri (Yönetici paneli)"
echo "  • ExamCreation testleri (Sınav oluşturma)"
echo "  • ExamTaking testleri (Sınav alma)"
echo "  • Ve diğer UI testleri..."

# Tüm Selenium testlerini çalıştır
./mvnw failsafe:integration-test -Dtest=**/*SeleniumTest

echo -e "${GREEN}🎉 Selenium testleri tamamlandı!${NC}"
