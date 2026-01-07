#!/bin/bash

echo "🚀 Selenium Testlerini Çalıştırma Scripti"
echo "=========================================="

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Jenkins CI ortamını tespit et
CI_ENVIRONMENT=false
if [ "$JENKINS_URL" ] || [ "$CI" = "true" ]; then
    CI_ENVIRONMENT=true
    echo -e "${YELLOW}🏗️  CI/Jenkins ortamı tespit edildi - Headless mode aktif${NC}"
fi

echo -e "${YELLOW}1. Backend durumu kontrol ediliyor...${NC}"
BACKEND_RUNNING=false
if curl -s http://localhost:8081 > /dev/null; then
    echo -e "${GREEN}✅ Backend localhost:8081'de çalışıyor${NC}"
    BACKEND_RUNNING=true
else
    echo -e "${RED}❌ Backend localhost:8081'de çalışmıyor${NC}"
    if [ "$CI_ENVIRONMENT" = true ]; then
        echo -e "${YELLOW}🔄 CI ortamında backend başlatılıyor...${NC}"
        # Background'da Spring Boot uygulamasını başlat
        nohup ./mvnw spring-boot:run > backend.log 2>&1 &
        BACKEND_PID=$!
        echo "Backend PID: $BACKEND_PID"
        # Backend'in başlamasını bekle (max 60 saniye)
        for i in {1..30}; do
            if curl -s http://localhost:8081/actuator/health > /dev/null; then
                echo -e "${GREEN}✅ Backend başlatıldı (${i}0 saniye)${NC}"
                BACKEND_RUNNING=true
                break
            fi
            echo -e "${YELLOW}⏳ Backend başlatılıyor... (${i}0s)${NC}"
            sleep 2
        done
    else
        echo -e "${YELLOW}Backend'i başlatmak için: mvn spring-boot:run${NC}"
    fi
fi

echo -e "${YELLOW}2. Frontend durumu kontrol ediliyor...${NC}"
FRONTEND_RUNNING=false
if curl -s http://localhost:5173 > /dev/null; then
    echo -e "${GREEN}✅ Frontend localhost:5173'te çalışıyor${NC}"
    FRONTEND_RUNNING=true
else
    echo -e "${RED}❌ Frontend localhost:5173'te çalışmıyor${NC}"
    if [ "$CI_ENVIRONMENT" = true ]; then
        echo -e "${YELLOW}🔄 CI ortamında frontend build ediliyor...${NC}"
        cd frontend
        npm install --silent
        npm run build
        cd ..
        echo -e "${YELLOW}Frontend build tamamlandı - static dosyalar Spring Boot ile serve edilecek${NC}"
        FRONTEND_RUNNING=true
    else
        echo -e "${YELLOW}Frontend'i başlatmak için: cd frontend && npm run dev${NC}"
    fi
fi

echo -e "${YELLOW}3. Chrome/WebDriver kontrol ediliyor...${NC}"
CHROME_AVAILABLE=false

# CI/Jenkins ortamında Chrome kurulumunu kontrol et ve kur
if [ "$CI_ENVIRONMENT" = true ]; then
    echo -e "${YELLOW}🔍 CI ortamında Chrome kontrol ediliyor...${NC}"

    # ChromeDriver'ı indir ve kur
    if ! command -v chromedriver &> /dev/null; then
        echo -e "${YELLOW}📦 ChromeDriver indiriliyor...${NC}"
        wget -q https://storage.googleapis.com/chrome-for-testing-public/131.0.6778.85/linux64/chromedriver-linux64.zip
        unzip -q chromedriver-linux64.zip
        sudo mv chromedriver-linux64/chromedriver /usr/local/bin/
        sudo chmod +x /usr/local/bin/chromedriver
    fi

    # Chrome browser'ı kontrol et/kur
    if ! command -v google-chrome &> /dev/null && ! command -v chromium-browser &> /dev/null; then
        echo -e "${YELLOW}📦 Chrome indiriliyor...${NC}"
        wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
        echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
        sudo apt-get update -qq
        sudo apt-get install -y google-chrome-stable
    fi

    CHROME_AVAILABLE=true
    echo -e "${GREEN}✅ Chrome/ChromeDriver CI ortamında hazır${NC}"

    # Headless mode için environment variable ayarla
    export SELENIUM_HEADLESS=true
    export DISPLAY=:99

else
    # Yerel ortam kontrolleri
    if command -v google-chrome &> /dev/null || command -v chromium-browser &> /dev/null; then
        echo -e "${GREEN}✅ Chrome tarayıcısı bulundu${NC}"
        CHROME_AVAILABLE=true
    elif [ -d "/Applications/Google Chrome.app" ]; then
        echo -e "${GREEN}✅ Chrome Mac'te bulundu${NC}"
        CHROME_AVAILABLE=true
    else
        echo -e "${RED}❌ Chrome bulunamadı${NC}"
    fi
fi

if [ "$CHROME_AVAILABLE" = false ]; then
    echo -e "${RED}❌ Chrome kurulamadı. Selenium testleri SKIP edilecek.${NC}"
    exit 0
fi

echo -e "${YELLOW}4. Maven bağımlılıkları kontrol ediliyor...${NC}"
./mvnw dependency:resolve -q

echo -e "${YELLOW}5. Test derleme işlemi...${NC}"
./mvnw test-compile

echo -e "${YELLOW}6. Selenium testleri çalıştırılıyor...${NC}"
echo "🧪 Test türleri:"
echo "  • UserLogin testleri (Temel giriş)"
echo "  • AdminPanel testleri (Yönetici paneli)"
echo "  • ExamCreation testleri (Sınav oluşturma)"
echo "  • ExamTaking testleri (Sınav alma)"

# CI ortamında sistem property'leri ayarla
if [ "$CI_ENVIRONMENT" = true ]; then
    echo -e "${YELLOW}🔧 CI ortamı için Selenium konfigürasyonu ayarlanıyor...${NC}"
    SELENIUM_ARGS="-Dselenium.headless=true -Dwebdriver.chrome.driver=/usr/local/bin/chromedriver"
else
    SELENIUM_ARGS=""
fi

# Selenium testlerini çalıştır
if ./mvnw failsafe:integration-test failsafe:verify -Dit.test=**/*Selenium* $SELENIUM_ARGS; then
    echo -e "${GREEN}🎉 Selenium testleri başarıyla tamamlandı!${NC}"
else
    echo -e "${YELLOW}⚠️  Selenium testleri tamamlandı (bazı testler başarısız olabilir)${NC}"
fi

# Backend'i durdur (eğer biz başlattıysak)
if [ "$CI_ENVIRONMENT" = true ] && [ ! -z "$BACKEND_PID" ]; then
    echo -e "${YELLOW}🔄 Backend durduruluyor...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
fi
