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

# Driver konfigürasyonunu oku
USE_CHROME=false
USE_HTMLUNIT=false
CHROME_BINARY_PATH=""

if [ -f "/tmp/chrome-config" ]; then
    source /tmp/chrome-config
    if [ "$USE_HTMLUNIT" = "true" ]; then
        echo -e "${GREEN}✅ HTMLUnit driver kullanılacak - Chrome'a bağımlılık yok${NC}"
    elif [ "$USE_CHROME" = "true" ]; then
        echo -e "${GREEN}✅ Chrome driver kullanılacak: $CHROME_BINARY_PATH${NC}"
        USE_CHROME=true
    fi
else
    # Fallback: HTMLUnit'i varsayılan yap
    USE_HTMLUNIT=true
    echo -e "${YELLOW}⚠️ Driver config bulunamadı - HTMLUnit varsayılan olarak kullanılacak${NC}"
fi

# Gerekli komutları kontrol et
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 komutu bulunamadı${NC}"
        return 1
    fi
    return 0
}

echo -e "${YELLOW}1. Backend durumu kontrol ediliyor...${NC}"
BACKEND_RUNNING=false
BACKEND_PID=""

# Backend port kontrolü - İyileştirilmiş
check_backend() {
    # Önce port kontrolü (8081)
    if netstat -tuln 2>/dev/null | grep -q ":8081 " || ss -tuln 2>/dev/null | grep -q ":8081 "; then
        echo "Port 8081 açık tespit edildi, sağlık kontrolü yapılıyor..."
        # Sonra health endpoint kontrolü
        if curl -s --connect-timeout 3 --max-time 8 http://localhost:8081/actuator/health > /dev/null 2>&1; then
            return 0
        else
            # Health endpoint yoksa ana sayfa kontrolü
            if curl -s --connect-timeout 3 --max-time 8 http://localhost:8081/ > /dev/null 2>&1; then
                return 0
            fi
        fi
    fi
    return 1
}

if check_backend; then
    echo -e "${GREEN}✅ Backend localhost:8081'de çalışıyor${NC}"
    BACKEND_RUNNING=true
else
    echo -e "${RED}❌ Backend localhost:8081'de çalışmıyor${NC}"
    echo -e "${YELLOW}🔄 CI ortamında backend başlatılıyor...${NC}"

    # Önceki backend process'lerini temizle
    pkill -f "spring-boot:run" 2>/dev/null || true
    pkill -f "online_egitim_sinav_kod.*\.jar" 2>/dev/null || true
    sleep 3

    # Port'u kullanan process'leri temizle
    lsof -ti:8081 | xargs kill -9 2>/dev/null || true
    sleep 2

    # Backend'i arka planda başlat - daha hızlı profil ile
    echo "Backend başlatılıyor..."
    nohup ./mvnw spring-boot:run \
        -Dspring-boot.run.profiles=test \
        -Dserver.port=8081 \
        -Dspring.jpa.hibernate.ddl-auto=create-drop \
        -Dlogging.level.org.springframework=WARN \
        -Dspring.jpa.show-sql=false > backend.log 2>&1 &
    BACKEND_PID=$!
    echo "Backend PID: $BACKEND_PID"

    # Backend'in başlamasını bekle (max 120 saniye)
    echo -e "${YELLOW}⏳ Backend başlatılması bekleniyor...${NC}"
    TIMEOUT=120
    COUNTER=0

    while [ $COUNTER -lt $TIMEOUT ]; do
        if check_backend; then
            echo -e "${GREEN}✅ Backend başarıyla başlatıldı ($COUNTER saniye)${NC}"
            BACKEND_RUNNING=true
            break
        fi

        # Her 10 saniyede bir güncelleme ver
        if [ $((COUNTER % 10)) -eq 0 ] && [ $COUNTER -gt 0 ]; then
            echo -e "${YELLOW}⏳ Backend hala başlatılıyor... (${COUNTER}s)${NC}"
        fi

        sleep 1
        COUNTER=$((COUNTER + 1))
    done

    if [ "$BACKEND_RUNNING" = false ]; then
        echo -e "${RED}❌ Backend $TIMEOUT saniyede başlatılamadı${NC}"
        echo -e "${YELLOW}Backend log dosyasının son 30 satırı:${NC}"
        tail -30 backend.log 2>/dev/null || echo "Log dosyası okunamadı"

        # Port kullanım durumunu kontrol et
        echo -e "${YELLOW}Port 8081 durumu:${NC}"
        netstat -tuln | grep 8081 || echo "Port 8081 kullanımda değil"

        if [ ! -z "$BACKEND_PID" ]; then
            kill -9 $BACKEND_PID 2>/dev/null || true
        fi

        echo -e "${YELLOW}⚠️  Backend başlamadı ancak testler devam ediyor (unit testler çalışabilir)${NC}"
    fi
fi

echo -e "${YELLOW}2. Frontend durumu kontrol ediliyor...${NC}"
# Frontend build - CI ortamında sadece build yap, ayrı server başlatma
if [ -d "frontend" ]; then
    echo -e "${YELLOW}🔄 Frontend build ediliyor...${NC}"
    cd frontend
    if command -v npm &> /dev/null; then
        npm ci --silent --no-audit 2>/dev/null || npm install --silent --no-audit 2>/dev/null || echo "⚠️  npm install sorunu"
        npm run build --silent 2>/dev/null || echo "⚠️  npm build sorunu"
    fi
    cd ..
    echo -e "${YELLOW}Frontend build tamamlandı - static dosyalar Spring Boot ile serve edilecek${NC}"
else
    echo -e "${YELLOW}Frontend klasörü bulunamadı${NC}"
fi

echo -e "${YELLOW}3. Selenium Driver kontrol ediliyor...${NC}"

# Driver seçimi ve konfigürasyonu
if [ "$USE_HTMLUNIT" = "true" ]; then
    echo -e "${GREEN}✅ HTMLUnit Driver seçildi${NC}"
    echo -e "${GREEN}  • Chrome/Chromium'a bağımlılık yok${NC}"
    echo -e "${GREEN}  • Virtual display gerekmiyor${NC}"
    echo -e "${GREEN}  • JavaScript desteği var${NC}"

    export SELENIUM_DRIVER=htmlunit
    export SELENIUM_HEADLESS=true

elif [ "$USE_CHROME" = "true" ] && [ ! -z "$CHROME_BINARY_PATH" ]; then
    echo -e "${GREEN}✅ Chrome Driver seçildi: $CHROME_BINARY_PATH${NC}"

    # Chrome versiyonunu kontrol et
    CHROME_VERSION=$($CHROME_BINARY_PATH --version 2>/dev/null || echo "Versiyon alınamadı")
    echo -e "${GREEN}Chrome versiyonu: $CHROME_VERSION${NC}"

    export SELENIUM_DRIVER=chrome
    export CHROME_BINARY_PATH="$CHROME_BINARY_PATH"
    export SELENIUM_HEADLESS=true

else
    # Fallback to HTMLUnit
    echo -e "${YELLOW}⚠️  Chrome mevcut değil - HTMLUnit'e fallback${NC}"
    export SELENIUM_DRIVER=htmlunit
    export SELENIUM_HEADLESS=true
fi

echo -e "${YELLOW}4. Maven bağımlılıkları ve test derleme...${NC}"
./mvnw test-compile -q || echo "⚠️  Test derleme sorunu"

echo -e "${YELLOW}5. Selenium testleri çalıştırılıyor...${NC}"
echo "🧪 Test türleri:"
echo "  • UserLogin testleri (Temel giriş)"
echo "  • AdminPanel testleri (Yönetici paneli)"
echo "  • ExamCreation testleri (Sınav oluşturma)"
echo "  • ExamTaking testleri (Sınav alma)"
echo "🔧 Driver: $SELENIUM_DRIVER"

if [ "$CI_ENVIRONMENT" = true ]; then
    echo -e "${YELLOW}🔧 CI ortamı için Selenium konfigürasyonu ayarlanıyor...${NC}"
    export CI=true
fi

# Selenium testlerini çalıştır
echo "==============================================="
echo "🧪 SELENIUM TESTLERİ BAŞLATIYOR"
echo "==============================================="

SELENIUM_EXIT_CODE=0

# Maven ile Selenium testlerini çalıştır - driver tipine göre parametreler
if [ "$SELENIUM_DRIVER" = "htmlunit" ]; then
    ./mvnw failsafe:integration-test failsafe:verify \
        -Pselenium-tests \
        -Dci=true \
        -Dselenium.driver=htmlunit \
        -Dselenium.headless=true \
        -Dapp.baseUrl=http://localhost:8081 \
        -DfailIfNoTests=false \
        -Dmaven.test.failure.ignore=false \
        -q

elif [ "$SELENIUM_DRIVER" = "chrome" ]; then
    ./mvnw failsafe:integration-test failsafe:verify \
        -Pselenium-tests \
        -Dci=true \
        -Dselenium.driver=chrome \
        -Dselenium.headless=${SELENIUM_HEADLESS:-true} \
        -Dchrome.binary.path="$CHROME_BINARY_PATH" \
        -Dapp.baseUrl=http://localhost:8081 \
        -DfailIfNoTests=false \
        -Dmaven.test.failure.ignore=false \
        -Dwebdriver.chrome.driver="" \
        -Dwebdriver.chrome.args="--no-sandbox,--disable-dev-shm-usage,--disable-gpu,--headless" \
        -q
fi

SELENIUM_EXIT_CODE=$?

echo "==============================================="
if [ $SELENIUM_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ SELENIUM TESTLERİ BAŞARILI${NC}"
else
    echo -e "${RED}❌ SELENIUM TESTLERİ BAŞARISIZ (Exit Code: $SELENIUM_EXIT_CODE)${NC}"
fi
echo "==============================================="

# Test sonuçlarını göster
if [ -d "target/selenium-reports" ]; then
    echo -e "${YELLOW}📊 Selenium Test Sonuçları:${NC}"
    find target/selenium-reports -name "*.xml" 2>/dev/null | head -5 | while read file; do
        echo "  📄 $file"
    done
fi

if [ -d "target/failsafe-reports" ]; then
    echo -e "${YELLOW}📊 Failsafe Test Sonuçları:${NC}"
    find target/failsafe-reports -name "*.xml" 2>/dev/null | head -5 | while read file; do
        echo "  📄 $file"
    done
fi

echo -e "${YELLOW}6. Test tamamlandı${NC}"

# Cleanup function
cleanup() {
    echo -e "${YELLOW}🔄 Temizlik işlemleri...${NC}"

    # Backend'i durdur
    if [ ! -z "$BACKEND_PID" ] && ps -p "$BACKEND_PID" > /dev/null 2>&1; then
        echo "Backend durduruluyor..."
        kill -TERM "$BACKEND_PID" 2>/dev/null || true
        sleep 5
        kill -KILL "$BACKEND_PID" 2>/dev/null || true
        echo "Backend process sonlandırıldı"
    fi

    # Spring Boot process'lerini temizle
    pkill -f "spring-boot:run" 2>/dev/null || true

    # Port'u kullanan process'leri temizle
    lsof -ti:8081 | xargs kill -9 2>/dev/null || true

    # Virtual display'i durdur (sadece Chrome kullanıldıysa)
    if [ "$USE_CHROME" = "true" ]; then
        pkill -f "Xvfb.*:99" 2>/dev/null || true
    fi

    echo "Temizlik tamamlandı"
}

# Script sonlandığında cleanup çalıştır
trap cleanup EXIT

echo "🏁 Script tamamlandı"
exit $SELENIUM_EXIT_CODE
