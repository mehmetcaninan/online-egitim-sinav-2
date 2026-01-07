#!/bin/bash

echo "🚀 Selenium Testlerini Çalıştırma Scripti"
echo "=========================================="

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}1. Backend durumu kontrol ediliyor...${NC}"
BACKEND_RUNNING=false
if curl -s http://localhost:8081 > /dev/null; then
    echo -e "${GREEN}✅ Backend localhost:8081'de çalışıyor${NC}"
    BACKEND_RUNNING=true
else
    echo -e "${RED}❌ Backend localhost:8081'de çalışmıyor${NC}"
    echo -e "${YELLOW}Backend'i başlatmak için: mvn spring-boot:run${NC}"
fi

echo -e "${YELLOW}2. Frontend durumu kontrol ediliyor...${NC}"
FRONTEND_RUNNING=false
if curl -s http://localhost:5173 > /dev/null; then
    echo -e "${GREEN}✅ Frontend localhost:5173'te çalışıyor${NC}"
    FRONTEND_RUNNING=true
else
    echo -e "${RED}❌ Frontend localhost:5173'te çalışmıyor${NC}"
    echo -e "${YELLOW}Frontend'i başlatmak için: cd frontend && npm run dev${NC}"
fi

echo -e "${YELLOW}3. Chrome WebDriver kontrol ediliyor...${NC}"
CHROME_AVAILABLE=false
if command -v google-chrome &> /dev/null || command -v chromium-browser &> /dev/null; then
    echo -e "${GREEN}✅ Chrome tarayıcısı bulundu${NC}"
    CHROME_AVAILABLE=true
else
    echo -e "${RED}❌ Chrome tarayıcısı bulunamadı${NC}"
    echo "Selenium testleri Chrome WebDriver kullanır"
    echo -e "${YELLOW}Bu Jenkins ajanında Chrome olmadığı için Selenium UI testleri SKIP edilecek.${NC}"
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

# Backend ve Frontend kontrolü
if [ "$BACKEND_RUNNING" = false ] || [ "$FRONTEND_RUNNING" = false ]; then
    echo -e "${YELLOW}⚠️  UYARI: Backend veya Frontend çalışmıyor.${NC}"
    echo -e "${YELLOW}Bu Jenkins ortamında UI senaryoları TAM OLARAK doğrulanamayabilir.${NC}"
    echo -e "${YELLOW}Gerçek senaryo doğrulamaları yerel ortamda yapılmalıdır.${NC}"
fi

# Eğer Chrome yoksa, Jenkins'te testleri çalıştırmaya çalışmayalım
# Ancak Mac agent'ında Chrome olmalı, bu yüzden sadece uyarı ver
if [ "$CHROME_AVAILABLE" = false ]; then
    echo -e "${YELLOW}⚠️  Chrome/ChromeDriver bulunamadı.${NC}"
    echo -e "${YELLOW}Mac agent kullanılıyorsa Chrome kurulu olmalı. Kontrol ediliyor...${NC}"
    
    # Mac'te Chrome'un farklı konumlarını kontrol et
    if [ -d "/Applications/Google Chrome.app" ]; then
        echo -e "${GREEN}✅ Chrome Mac'te bulundu (/Applications/Google Chrome.app)${NC}"
        CHROME_AVAILABLE=true
    else
        echo -e "${RED}❌ Chrome bulunamadı. Selenium testleri SKIP edilecek.${NC}"
        echo -e "${YELLOW}Not: Test senaryoları kodda hazır; gerçek çalıştırma Chrome yüklü bir ortamda yapılmalıdır.${NC}"
        exit 0
    fi
fi

# Tüm Selenium testlerini çalıştır (hem *SeleniumTest.java hem de *SeleniumIT.java)
# Maven failsafe için -Dit.test kullanılır (surefire için -Dtest)
./mvnw failsafe:integration-test failsafe:verify -Dit.test=**/*Selenium*

echo -e "${GREEN}🎉 Selenium testleri tamamlandı!${NC}"
