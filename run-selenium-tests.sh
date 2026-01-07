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

# Gerekli komutları kontrol et
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 komutu bulunamadı${NC}"
        return 1
    fi
    return 0
}

# CI ortamında gerekli paketleri kur
if [ "$CI_ENVIRONMENT" = true ]; then
    echo -e "${YELLOW}🔧 CI ortamı için gerekli araçlar kontrol ediliyor...${NC}"

    # Package manager'ı tespit et ve gerekli paketleri kur
    if command -v apt-get &> /dev/null; then
        echo "📦 Ubuntu/Debian package manager tespit edildi"
        export DEBIAN_FRONTEND=noninteractive

        # Sistem güncellemesi
        apt-get update -qq || echo "⚠️  apt-get update başarısız"

        # Temel araçları kur
        apt-get install -y -qq wget curl unzip npm xvfb || echo "⚠️  Bazı paketler kurulamadı"

        # Chrome kurulumu
        if ! command -v google-chrome &> /dev/null; then
            echo "🌐 Google Chrome kuruluyor..."
            wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - 2>/dev/null || echo "Chrome key ekleme başarısız"
            echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list 2>/dev/null || echo "Chrome repo ekleme başarısız"
            apt-get update -qq || echo "Chrome repo update başarısız"
            apt-get install -y -qq google-chrome-stable || echo "Chrome kurulumu başarısız oldu"
        fi

    elif command -v yum &> /dev/null; then
        echo "📦 RHEL/CentOS package manager tespit edildi"
        yum install -y wget curl unzip npm xorg-x11-server-Xvfb || echo "⚠️  Bazı paketler kurulamadı"

        # Chrome kurulumu
        if ! command -v google-chrome &> /dev/null; then
            echo "🌐 Google Chrome kuruluyor..."
            wget -O /tmp/google-chrome.rpm https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm 2>/dev/null || echo "Chrome indirme başarısız"
            yum localinstall -y /tmp/google-chrome.rpm || echo "Chrome kurulumu başarısız"
        fi
    fi

    # Virtual display başlat
    if command -v Xvfb &> /dev/null; then
        echo "🖥️  Virtual display başlatılıyor..."
        export DISPLAY=:99
        Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &
        XVFB_PID=$!
        sleep 2
        echo "Virtual display PID: $XVFB_PID"
    fi
fi

echo -e "${YELLOW}1. Backend durumu kontrol ediliyor...${NC}"
BACKEND_RUNNING=false
BACKEND_PID=""

# Backend port kontrolü
check_backend() {
    if curl -s --max-time 5 http://localhost:8081/actuator/health > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

if check_backend; then
    echo -e "${GREEN}✅ Backend localhost:8081'de çalışıyor${NC}"
    BACKEND_RUNNING=true
else
    echo -e "${RED}❌ Backend localhost:8081'de çalışmıyor${NC}"
    echo -e "${YELLOW}🔄 CI ortamında backend başlatılıyor...${NC}"

    # Backend'i arka planda başlat
    nohup ./mvnw spring-boot:run -Dspring-boot.run.profiles=test > backend.log 2>&1 &
    BACKEND_PID=$!
    echo "Backend PID: $BACKEND_PID"

    # Backend'in başlamasını bekle (max 120 saniye)
    for i in {1..12}; do
        if check_backend; then
            echo -e "${GREEN}✅ Backend başlatıldı (${i}0 saniye)${NC}"
            BACKEND_RUNNING=true
            break
        fi
        echo -e "${YELLOW}⏳ Backend başlatılıyor... (${i}0s)${NC}"
        sleep 10
    done

    if [ "$BACKEND_RUNNING" = false ]; then
        echo -e "${RED}❌ Backend 120 saniyede başlatılamadı${NC}"
        if [ ! -z "$BACKEND_PID" ]; then
            kill $BACKEND_PID 2>/dev/null || true
        fi
        exit 1
    fi
fi

echo -e "${YELLOW}2. Frontend durumu kontrol ediliyor...${NC}"
FRONTEND_RUNNING=false

if curl -s --max-time 5 http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend localhost:5173'te çalışıyor${NC}"
    FRONTEND_RUNNING=true
else
    echo -e "${RED}❌ Frontend localhost:5173'te çalışmıyor${NC}"
    echo -e "${YELLOW}🔄 CI ortamında frontend build ediliyor...${NC}"

    # Frontend build
    if [ -d "frontend" ]; then
        cd frontend
        if command -v npm &> /dev/null; then
            npm ci --silent || npm install --silent || echo "⚠️  npm install başarısız"
            npm run build --silent || echo "⚠️  npm build başarısız"
        fi
        cd ..
    fi

    echo -e "${YELLOW}Frontend build tamamlandı - static dosyalar Spring Boot ile serve edilecek${NC}"
fi

echo -e "${YELLOW}3. Chrome/WebDriver kontrol ediliyor...${NC}"
if [ "$CI_ENVIRONMENT" = true ]; then
    echo -e "${YELLOW}🔍 CI ortamında Chrome kontrol ediliyor...${NC}"

    # Chrome binary'yi bul
    CHROME_BINARY=""
    POSSIBLE_CHROME_PATHS=("/usr/bin/google-chrome" "/usr/bin/google-chrome-stable" "/usr/bin/chromium-browser" "/opt/google/chrome/chrome")

    for path in "${POSSIBLE_CHROME_PATHS[@]}"; do
        if [ -f "$path" ]; then
            CHROME_BINARY="$path"
            echo -e "${GREEN}✅ Chrome binary bulundu: $path${NC}"
            break
        fi
    done

    if [ -z "$CHROME_BINARY" ]; then
        echo -e "${RED}❌ Chrome binary bulunamadı${NC}"
        echo "Chrome kurulu değil gibi görünüyor, testler atlanacak"
        export skipSelenium=true
    else
        export chrome.binary.path="$CHROME_BINARY"
    fi
fi

echo -e "${YELLOW}4. Maven bağımlılıkları kontrol ediliyor...${NC}"
echo -e "${YELLOW}5. Test derleme işlemi...${NC}"
./mvnw test-compile -q

echo -e "${YELLOW}6. Selenium testleri çalıştırılıyor...${NC}"
echo "🧪 Test türleri:"
echo "  • UserLogin testleri (Temel giriş)"
echo "  • AdminPanel testleri (Yönetici paneli)"
echo "  • ExamCreation testleri (Sınav oluşturma)"
echo "  • ExamTaking testleri (Sınav alma)"

if [ "$CI_ENVIRONMENT" = true ]; then
    echo -e "${YELLOW}🔧 CI ortamı için Selenium konfigürasyonu ayarlanıyor...${NC}"
    export CI=true
    export SELENIUM_HEADLESS=true
fi

# Selenium testlerini çalıştır
./mvnw failsafe:integration-test failsafe:verify -Dtest="**/*Selenium*" -DfailIfNoTests=false -DskipSelenium=false

SELENIUM_EXIT_CODE=$?

echo -e "${YELLOW}⚠️  Selenium testleri tamamlandı (bazı testler başarısız olabilir)${NC}"

# Cleanup
cleanup() {
    echo -e "${YELLOW}🔄 Backend durduruluyor...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        echo "Backend process sonlandırıldı"
    fi

    # Spring Boot process'lerini temizle
    pkill -f "spring-boot:run" 2>/dev/null || true

    # Virtual display'i durdur
    if [ ! -z "$XVFB_PID" ]; then
        kill $XVFB_PID 2>/dev/null || true
        echo "Virtual display sonlandırıldı"
    fi
    pkill Xvfb 2>/dev/null || true
}

# Script sonlandığında cleanup çalıştır
trap cleanup EXIT

echo "🏁 Script tamamlandı"
exit $SELENIUM_EXIT_CODE
