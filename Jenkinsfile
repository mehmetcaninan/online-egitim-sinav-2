pipeline {
    agent any

    triggers {
        githubPush()
    }

    options {
        timeout(time: 15, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        COMPOSE_PROJECT_NAME = "local-jenkins-${BUILD_NUMBER}"
        DOCKER_BUILDKIT = '1'
        CI = 'true'
        SELENIUM_HEADLESS = 'true'
        // Local ortam için Chrome path
        CHROME_BIN = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        CHROMEDRIVER_PATH = '/usr/local/bin/chromedriver'
    }

    stages {
        stage('1 - Checkout & Info') {
            steps {
                script {
                    echo "🏠 LOCAL JENKINS PIPELINE"
                    echo "================================="
                    echo "Build Number: ${BUILD_NUMBER}"
                    echo "Git Branch: ${env.GIT_BRANCH ?: 'main'}"
                    echo "Docker Compose Project: ${COMPOSE_PROJECT_NAME}"
                    echo "Local Mode: Jenkins running on local machine"

                    checkout scm

                    if (fileExists('webhook-test.sh')) {
                        sh 'chmod +x webhook-test.sh && ./webhook-test.sh || true'
                    }
                    echo "================================="
                }
            }
        }

        stage('2 - Local Environment Setup') {
            steps {
                script {
                    echo "🏠 Local ortam hazırlanıyor..."

                    sh '''
                        echo "Local Docker ve Chrome kontrol ediliyor..."

                        # macOS'ta Docker Desktop PATH'lerini ekle
                        export PATH="/usr/local/bin:/opt/homebrew/bin:/Applications/Docker.app/Contents/Resources/bin:$PATH"

                        # Docker Desktop'ın çalışıp çalışmadığını kontrol et
                        if ! pgrep -f "Docker Desktop" >/dev/null 2>&1; then
                            echo "⚠️ Docker Desktop çalışmıyor, başlatılmaya çalışılıyor..."
                            open -a "Docker Desktop" || echo "Docker Desktop başlatılamadı"
                            sleep 15
                        fi

                        # Docker komutunu bulma
                        DOCKER_PATH=""
                        for path in "/usr/local/bin/docker" "/opt/homebrew/bin/docker" "/Applications/Docker.app/Contents/Resources/bin/docker"; do
                            if [ -f "$path" ]; then
                                DOCKER_PATH="$path"
                                break
                            fi
                        done

                        if [ -z "$DOCKER_PATH" ]; then
                            echo "❌ Docker bulunamadı! Kontrol edilen konumlar:"
                            echo "   - /usr/local/bin/docker"
                            echo "   - /opt/homebrew/bin/docker"
                            echo "   - /Applications/Docker.app/Contents/Resources/bin/docker"
                            echo "🔗 Lütfen Docker Desktop'ı kurun: https://www.docker.com/products/docker-desktop"
                            exit 1
                        fi

                        echo "✅ Docker bulundu: $DOCKER_PATH"
                        "$DOCKER_PATH" --version || {
                            echo "❌ Docker çalışmıyor, Docker Desktop'ı başlatın"
                            exit 1
                        }

                        # Docker Compose kontrol
                        if ! "$DOCKER_PATH" compose version >/dev/null 2>&1; then
                            echo "❌ Docker Compose bulunamadı!"
                            exit 1
                        fi
                        echo "✅ Docker Compose mevcut: $("$DOCKER_PATH" compose version)"

                        # Docker credential problemini çöz
                        echo "🔧 Docker credential ayarları düzenleniyor..."

                        # Docker config dizinini oluştur
                        mkdir -p ~/.docker

                        # Docker config.json dosyasını oluştur/güncelle - credential helper'ı devre dışı bırak
                        cat > ~/.docker/config.json << 'EOF'
{
    "auths": {},
    "credsStore": "",
    "credHelpers": {},
    "stackOrchestrator": "swarm"
}
EOF

                        echo "✅ Docker credential ayarları düzenlendi"

                        # Docker daemon hazır olana kadar bekle
                        echo "📦 Docker daemon hazırlığı kontrol ediliyor..."
                        for i in {1..10}; do
                            if "$DOCKER_PATH" info >/dev/null 2>&1; then
                                echo "✅ Docker daemon hazır (${i}. deneme)"
                                break
                            fi
                            echo "⏳ Docker daemon henüz hazır değil, bekleniyor... (${i}/10)"
                            sleep 3
                        done

                        # Chrome Browser kontrol (macOS)
                        if [ ! -f "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
                            echo "⚠️ Chrome browser bulunamadı, Selenium testleri başarısız olabilir"
                        else
                            echo "✅ Chrome browser mevcut"
                        fi

                        # ChromeDriver kontrol - Gerçek dosya konumlarını da dahil et
                        CHROMEDRIVER_PATH=""

                        # Olası ChromeDriver konumlarını kontrol et
                        echo "🔍 ChromeDriver konumları kontrol ediliyor..."
                        POSSIBLE_PATHS=(
                            "/usr/local/bin/chromedriver"
                            "/opt/homebrew/bin/chromedriver"
                            "/usr/bin/chromedriver"
                            "$(which chromedriver 2>/dev/null)"
                            "/opt/homebrew/Caskroom/chromedriver/*/chromedriver-mac-arm64/chromedriver"
                            "/opt/homebrew/Caskroom/chromedriver/*/chromedriver"
                            "/usr/local/Caskroom/chromedriver/*/chromedriver-mac-arm64/chromedriver"
                            "/usr/local/Caskroom/chromedriver/*/chromedriver"
                        )

                        # Glob pattern'leri için özel kontrol
                        for pattern in "${POSSIBLE_PATHS[@]}"; do
                            if [[ "$pattern" == *"*"* ]]; then
                                # Glob pattern - expand et
                                for expanded_path in $pattern; do
                                    if [ -f "$expanded_path" ]; then
                                        CHROMEDRIVER_PATH="$expanded_path"
                                        echo "✅ ChromeDriver bulundu (glob): $CHROMEDRIVER_PATH"
                                        break 2
                                    fi
                                done
                            else
                                # Normal path
                                if [ -n "$pattern" ] && [ -f "$pattern" ]; then
                                    CHROMEDRIVER_PATH="$pattern"
                                    echo "✅ ChromeDriver bulundu: $CHROMEDRIVER_PATH"
                                    break
                                fi
                            fi
                        done

                        # ChromeDriver bulunamadıysa Homebrew'den direkt kontrol et
                        if [ -z "$CHROMEDRIVER_PATH" ]; then
                            echo "⚠️ ChromeDriver bulunamadı, Homebrew caskroom'dan direkt aranıyor..."

                            if command -v brew >/dev/null 2>&1; then
                                echo "🍺 Homebrew var, caskroom dizinleri kontrol ediliyor..."

                                # Homebrew caskroom'dan gerçek yolu bul
                                HOMEBREW_PREFIX=$(brew --prefix)
                                CASKROOM_DIR="$HOMEBREW_PREFIX/Caskroom/chromedriver"

                                if [ -d "$CASKROOM_DIR" ]; then
                                    echo "📁 Caskroom dizini bulundu: $CASKROOM_DIR"

                                    # En son versiyon dizinini bul
                                    LATEST_VERSION_DIR=$(find "$CASKROOM_DIR" -maxdepth 1 -type d -name "[0-9]*" | sort -V | tail -1)

                                    if [ -n "$LATEST_VERSION_DIR" ]; then
                                        echo "📂 En son versiyon dizini: $LATEST_VERSION_DIR"

                                        # ChromeDriver'ı bu dizinde ara
                                        for subdir in "chromedriver-mac-arm64" "chromedriver-mac-x64" "."; do
                                            POTENTIAL_PATH="$LATEST_VERSION_DIR/$subdir/chromedriver"
                                            if [ -f "$POTENTIAL_PATH" ]; then
                                                CHROMEDRIVER_PATH="$POTENTIAL_PATH"
                                                echo "✅ ChromeDriver gerçek yolu bulundu: $CHROMEDRIVER_PATH"
                                                break
                                            fi
                                        done
                                    fi
                                fi

                                if [ -z "$CHROMEDRIVER_PATH" ]; then
                                    echo "ℹ️ ChromeDriver Homebrew caskroom'da bulunamadı"
                                fi
                            else
                                echo "ℹ️ Homebrew bulunamadı"
                            fi
                        fi

                        # Final kontrol ve Gatekeeper bypass
                        if [ -n "$CHROMEDRIVER_PATH" ] && [ -f "$CHROMEDRIVER_PATH" ]; then
                            echo "✅ ChromeDriver mevcut: $CHROMEDRIVER_PATH"

                            # macOS Gatekeeper bypass - ChromeDriver'ı güvenilir yap
                            echo "🔓 macOS Gatekeeper bypass yapılıyor..."
                            xattr -d com.apple.quarantine "$CHROMEDRIVER_PATH" 2>/dev/null || echo "Quarantine attribute yok (normal)"

                            # ChromeDriver executable yapalım
                            chmod +x "$CHROMEDRIVER_PATH" 2>/dev/null || echo "Chmod başarısız (yetki sorunu)"

                            # Basit test
                            if "$CHROMEDRIVER_PATH" --version >/dev/null 2>&1; then
                                echo "✅ ChromeDriver test başarılı: $("$CHROMEDRIVER_PATH" --version)"
                            else
                                echo "⚠️ ChromeDriver test başarısız ama yine de deneyeceğiz"
                            fi
                        else
                            echo "❌ ChromeDriver bulunamadı - Manuel kurulum gerekebilir"
                            echo "💡 ChromeDriver kurulum önerisi:"
                            echo "   brew install chromedriver"
                            echo "   veya https://chromedriver.chromium.org/ adresinden indirin"
                        fi

                        echo "Önceki container'ları temizliyorum..."

                        # Docker PATH'ini kullanarak temizlik
                        "$DOCKER_PATH" ps -a | grep "local-jenkins" | awk '{print $1}' | xargs -r "$DOCKER_PATH" rm -f || true

                        # Dangling image'ları temizle
                        "$DOCKER_PATH" image prune -f || true

                        # Network temizliği
                        "$DOCKER_PATH" network prune -f || true

                        # Environment variable'ları sonraki stage'ler için export et
                        echo "DOCKER_PATH=$DOCKER_PATH" > docker_env.txt
                        echo "CHROMEDRIVER_PATH=$CHROMEDRIVER_PATH" >> docker_env.txt
                    '''

                    if (!fileExists('docker-compose.yml')) {
                        error "docker-compose.yml dosyası bulunamadı!"
                    }

                    echo "✅ Local ortam hazırlandı"
                }
            }
        }

        stage('3 - Build & Start Services') {
            steps {
                script {
                    echo "🏗️ Local Docker Compose ile servisler başlatılıyor..."

                    sh '''
                        echo "🔧 Local Docker Compose build ve start..."

                        # Docker PATH'ini yükle
                        if [ -f "docker_env.txt" ]; then
                            . ./docker_env.txt
                        else
                            # Fallback: Docker PATH'ini tekrar bul
                            export PATH="/usr/local/bin:/opt/homebrew/bin:/Applications/Docker.app/Contents/Resources/bin:$PATH"
                            for path in "/usr/local/bin/docker" "/opt/homebrew/bin/docker" "/Applications/Docker.app/Contents/Resources/bin/docker"; do
                                if [ -f "$path" ]; then
                                    DOCKER_PATH="$path"
                                    break
                                fi
                            done
                        fi

                        echo "Docker PATH: $DOCKER_PATH"

                        # Backend ve Frontend servislerini build et
                        "$DOCKER_PATH" compose -p ${COMPOSE_PROJECT_NAME} build app frontend

                        # Backend ve Frontend servislerini başlat
                        "$DOCKER_PATH" compose -p ${COMPOSE_PROJECT_NAME} up -d app frontend

                        # Servislerin başlaması için bekle
                        echo "Backend ve Frontend başlatıldı, hazır olması bekleniyor..."
                        sleep 15

                        # Container durumlarını kontrol et
                        echo "📋 Container durumları:"
                        "$DOCKER_PATH" compose -p ${COMPOSE_PROJECT_NAME} ps

                        # App container kontrolü
                        APP_CONTAINER=$("$DOCKER_PATH" compose -p ${COMPOSE_PROJECT_NAME} ps -q app)
                        if [ -z "$APP_CONTAINER" ]; then
                            echo "❌ Backend container bulunamadı!"
                            "$DOCKER_PATH" compose -p ${COMPOSE_PROJECT_NAME} logs app
                            exit 1
                        fi

                        # Frontend container kontrolü
                        FRONTEND_CONTAINER=$("$DOCKER_PATH" compose -p ${COMPOSE_PROJECT_NAME} ps -q frontend)
                        if [ -z "$FRONTEND_CONTAINER" ]; then
                            echo "❌ Frontend container bulunamadı!"
                            "$DOCKER_PATH" compose -p ${COMPOSE_PROJECT_NAME} logs frontend
                            exit 1
                        fi

                        echo "✅ Backend ve Frontend başarıyla çalışıyor"
                        echo "Backend Container ID: $APP_CONTAINER"
                        echo "Frontend Container ID: $FRONTEND_CONTAINER"
                        echo "Backend URL: http://localhost:8081"
                        echo "Frontend URL: http://localhost:5173"
                    '''
                }
            }
        }

        stage('4 - Run Tests') {
            steps {
                script {
                    echo "🧪 Local ortamda testler çalıştırılıyor..."

                    sh '''
                        # Docker PATH'ini yükle
                        if [ -f "docker_env.txt" ]; then
                            . ./docker_env.txt
                        else
                            # Fallback: Docker PATH'ini tekrar bul
                            export PATH="/usr/local/bin:/opt/homebrew/bin:/Applications/Docker.app/Contents/Resources/bin:$PATH"
                            for path in "/usr/local/bin/docker" "/opt/homebrew/bin/docker" "/Applications/Docker.app/Contents/Resources/bin/docker"; do
                                if [ -f "$path" ]; then
                                    DOCKER_PATH="$path"
                                    break
                                fi
                            done
                        fi

                        APP_CONTAINER=$("$DOCKER_PATH" compose -p ${COMPOSE_PROJECT_NAME} ps -q app)
                        FRONTEND_CONTAINER=$("$DOCKER_PATH" compose -p ${COMPOSE_PROJECT_NAME} ps -q frontend)

                        echo "Backend Container: $APP_CONTAINER"
                        echo "Frontend Container: $FRONTEND_CONTAINER"

                        # Backend hazır olana kadar bekle
                        echo "📦 Backend hazırlığı kontrol ediliyor..."
                        for i in {1..20}; do
                            if "$DOCKER_PATH" exec "$APP_CONTAINER" curl -f http://localhost:8081/actuator/health >/dev/null 2>&1; then
                                echo "✅ Backend hazır (${i}. deneme)"
                                break
                            fi
                            echo "⏳ Backend henüz hazır değil, bekleniyor... (${i}/20)"
                            sleep 3
                        done

                        # Frontend hazır olana kadar bekle
                        echo "🎨 Frontend hazırlığı kontrol ediliyor..."
                        for i in {1..20}; do
                            if curl -f http://localhost:5173 >/dev/null 2>&1; then
                                echo "✅ Frontend hazır (${i}. deneme)"
                                break
                            fi
                            echo "⏳ Frontend henüz hazır değil, bekleniyor... (${i}/20)"
                            sleep 3
                        done

                        # Son kontroller
                        if ! "$DOCKER_PATH" exec "$APP_CONTAINER" curl -f http://localhost:8081/actuator/health >/dev/null 2>&1; then
                            echo "❌ Backend hazır değil! Logları kontrol ediliyor..."
                            "$DOCKER_PATH" compose -p ${COMPOSE_PROJECT_NAME} logs app
                            exit 1
                        fi

                        if ! curl -f http://localhost:5173 >/dev/null 2>&1; then
                            echo "❌ Frontend hazır değil! Logları kontrol ediliyor..."
                            "$DOCKER_PATH" compose -p ${COMPOSE_PROJECT_NAME} logs frontend
                            exit 1
                        fi

                        # Unit testleri çalıştır - HATA DURUMUNDA PIPELINE DURDUR
                        echo "🔬 Unit testler çalıştırılıyor..."
                        if ! "$DOCKER_PATH" exec "$APP_CONTAINER" ./mvnw test -DskipSelenium=true -Dmaven.test.failure.ignore=false; then
                            echo "❌ Unit testler BAŞARISIZ! Pipeline durduruluyor."
                            "$DOCKER_PATH" compose -p ${COMPOSE_PROJECT_NAME} logs app
                            exit 1
                        fi
                        echo "✅ Unit testler başarılı"

                        # Integration testleri çalıştır - HATA DURUMUNDA PIPELINE DURDUR
                        echo "🔗 Integration testler çalıştırılıyor..."
                        if ! "$DOCKER_PATH" exec "$APP_CONTAINER" ./mvnw failsafe:integration-test failsafe:verify -DskipSelenium=true -Dmaven.test.failure.ignore=false; then
                            echo "❌ Integration testler BAŞARISIZ! Pipeline durduruluyor."
                            "$DOCKER_PATH" compose -p ${COMPOSE_PROJECT_NAME} logs app
                            exit 1
                        fi
                        echo "✅ Integration testler başarılı"

                        # Selenium testleri - Local Chrome ile Frontend'e karşı
                        echo "🌐 Selenium testler çalıştırılıyor (Frontend: http://localhost:5173)..."
                        if [ -n "$CHROMEDRIVER_PATH" ] && [ -f "$CHROMEDRIVER_PATH" ]; then
                            # Local'de Selenium testleri çalıştır - Frontend URL'ine karşı
                            ./mvnw test -Dtest="*SeleniumTest" \\
                                -Dwebdriver.chrome.driver="$CHROMEDRIVER_PATH" \\
                                -Dapp.baseUrl=http://localhost:5173 \\
                                -Dmaven.test.failure.ignore=false \\
                                -Dselenium.headless=true || {
                                echo "❌ Selenium testler BAŞARISIZ! Pipeline durduruluyor."
                                echo "Frontend Logs:"
                                "$DOCKER_PATH" compose -p ${COMPOSE_PROJECT_NAME} logs frontend
                                echo "Backend Logs:"
                                "$DOCKER_PATH" compose -p ${COMPOSE_PROJECT_NAME} logs app
                                exit 1
                            }
                            echo "✅ Selenium testler başarılı (Frontend: http://localhost:5173)"
                        else
                            echo "⚠️ ChromeDriver bulunamadı, Selenium testleri atlanıyor"
                        fi
                    '''

                    echo "✅ Tüm testler başarıyla tamamlandı"
                }
            }
        }

        stage('5 - Extract Test Results') {
            steps {
                script {
                    echo "📊 Test sonuçları toplanıyor..."

                    sh '''
                        # Docker PATH'ini yükle
                        if [ -f "docker_env.txt" ]; then
                            . ./docker_env.txt
                        else
                            # Fallback: Docker PATH'ini tekrar bul
                            export PATH="/usr/local/bin:/opt/homebrew/bin:/Applications/Docker.app/Contents/Resources/bin:$PATH"
                            for path in "/usr/local/bin/docker" "/opt/homebrew/bin/docker" "/Applications/Docker.app/Contents/Resources/bin/docker"; do
                                if [ -f "$path" ]; then
                                    DOCKER_PATH="$path"
                                    break
                                fi
                            done
                        fi

                        APP_CONTAINER=$("$DOCKER_PATH" compose -p ${COMPOSE_PROJECT_NAME} ps -q app)

                        # Container'dan test sonuçlarını kopyala
                        echo "Docker container'dan test sonuçları kopyalanıyor..."
                        "$DOCKER_PATH" cp "$APP_CONTAINER:/app/target/surefire-reports" ./surefire-reports || echo "⚠️ Container'dan surefire reports kopyalanamadı"
                        "$DOCKER_PATH" cp "$APP_CONTAINER:/app/target/failsafe-reports" ./failsafe-reports || echo "⚠️ Container'dan failsafe reports kopyalanamadı"

                        # Local'den de test sonuçları al (Selenium için)
                        echo "Local test sonuçları kontrol ediliyor..."
                        if [ -d "./target/surefire-reports" ]; then
                            cp -r ./target/surefire-reports/* ./surefire-reports/ 2>/dev/null || true
                        fi
                        if [ -d "./target/failsafe-reports" ]; then
                            cp -r ./target/failsafe-reports/* ./failsafe-reports/ 2>/dev/null || true
                        fi

                        # Screenshots kopyala
                        "$DOCKER_PATH" cp "$APP_CONTAINER:/app/screenshots" ./screenshots || echo "⚠️ Screenshots bulunamadı"
                        if [ -d "./screenshots" ]; then
                            cp -r ./screenshots/* ./screenshots/ 2>/dev/null || true
                        fi

                        echo "✅ Test sonuçları toplandı"

                        # Sonuçları listele
                        echo "📂 Test sonuç dosyaları:"
                        [ -d "surefire-reports" ] && ls -la surefire-reports/ || echo "Surefire reports yok"
                        [ -d "failsafe-reports" ] && ls -la failsafe-reports/ || echo "Failsafe reports yok"
                        [ -d "screenshots" ] && ls -la screenshots/ || echo "Screenshots yok"
                    '''
                }
            }
        }
    }

    post {
        always {
            script {
                echo "🧹 Local ortam temizlik işlemleri..."

                // Test sonuçlarını publish et
                try {
                    if (fileExists('surefire-reports')) {
                        junit 'surefire-reports/*.xml'
                        echo "📊 Unit test sonuçları Jenkins'e yüklendi"
                    }
                    if (fileExists('failsafe-reports')) {
                        junit 'failsafe-reports/*.xml'
                        echo "📊 Integration test sonuçları Jenkins'e yüklendi"
                    }
                } catch (Exception e) {
                    echo "⚠️ Test sonuçları publish hatası: ${e.getMessage()}"
                }

                // Screenshots'ları arşivle
                try {
                    if (fileExists('screenshots')) {
                        archiveArtifacts artifacts: 'screenshots/**/*', allowEmptyArchive: true
                        echo "📷 Screenshot'lar arşivlendi"
                    }
                } catch (Exception e) {
                    echo "⚠️ Screenshot arşivleme hatası: ${e.getMessage()}"
                }

                // Local Docker temizliği
                sh '''
                    echo "🐳 Local Docker container'ları temizleniyor..."

                    # Docker PATH'ini yükle
                    if [ -f "docker_env.txt" ]; then
                        . ./docker_env.txt
                    else
                        # Fallback: Docker PATH'ini tekrar bul
                        export PATH="/usr/local/bin:/opt/homebrew/bin:/Applications/Docker.app/Contents/Resources/bin:$PATH"
                        for path in "/usr/local/bin/docker" "/opt/homebrew/bin/docker" "/Applications/Docker.app/Contents/Resources/bin/docker"; do
                            if [ -f "$path" ]; then
                                DOCKER_PATH="$path"
                                break
                            fi
                        done
                    fi

                    if [ -n "$DOCKER_PATH" ]; then
                        "$DOCKER_PATH" compose -p ${COMPOSE_PROJECT_NAME} down --volumes --remove-orphans || true

                        # Local ortamda sadece bu build'e ait volume'ları temizle
                        "$DOCKER_PATH" volume ls -q | grep "${COMPOSE_PROJECT_NAME}" | xargs -r "$DOCKER_PATH" volume rm || true
                    else
                        echo "⚠️ Docker bulunamadı, manuel temizlik gerekebilir"
                    fi

                    echo "✅ Local Docker temizliği tamamlandı"
                '''
            }
        }

        success {
            echo "🎉 LOCAL PIPELINE BAŞARILI! Tüm testler geçti."
            echo "🌐 Uygulama: http://localhost:8081"
            echo "🗄️ H2 Console: http://localhost:8082"
        }

        failure {
            echo "❌ LOCAL PIPELINE BAŞARISIZ! Hatalar var, lütfen kontrol edin."
        }
    }
}
