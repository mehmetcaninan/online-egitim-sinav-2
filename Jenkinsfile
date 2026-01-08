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

                        # Docker kontrol
                        if ! docker --version >/dev/null 2>&1; then
                            echo "❌ Docker bulunamadı! Lütfen Docker Desktop'ı kurun."
                            exit 1
                        fi
                        echo "✅ Docker mevcut: $(docker --version)"

                        # Docker Compose kontrol
                        if ! docker compose version >/dev/null 2>&1; then
                            echo "❌ Docker Compose bulunamadı!"
                            exit 1
                        fi
                        echo "✅ Docker Compose mevcut: $(docker compose version)"

                        # Chrome Browser kontrol (macOS)
                        if [[ "$OSTYPE" == "darwin"* ]]; then
                            if [ ! -f "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
                                echo "⚠️ Chrome browser bulunamadı, Selenium testleri başarısız olabilir"
                            else
                                echo "✅ Chrome browser mevcut"
                            fi
                        fi

                        # ChromeDriver kontrol ve kurulum
                        if ! command -v chromedriver >/dev/null 2>&1; then
                            echo "⚠️ ChromeDriver bulunamadı, kurulum yapılıyor..."

                            # macOS için ChromeDriver kurulumu
                            if [[ "$OSTYPE" == "darwin"* ]]; then
                                if command -v brew >/dev/null 2>&1; then
                                    brew install chromedriver || echo "Brew ile ChromeDriver kurulumu başarısız"
                                else
                                    echo "❌ Homebrew bulunamadı, ChromeDriver manuel kurulmalı"
                                fi
                            fi
                        else
                            echo "✅ ChromeDriver mevcut: $(chromedriver --version)"
                        fi

                        echo "Önceki container'ları temizliyorum..."

                        # Local ortamda sadece bizim container'ları temizle
                        docker ps -a | grep "local-jenkins" | awk '{print $1}' | xargs -r docker rm -f || true

                        # Dangling image'ları temizle
                        docker image prune -f || true

                        # Network temizliği
                        docker network prune -f || true
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

                        # Backend ve Frontend servislerini build et
                        docker compose -p ${COMPOSE_PROJECT_NAME} build app frontend

                        # Backend ve Frontend servislerini başlat
                        docker compose -p ${COMPOSE_PROJECT_NAME} up -d app frontend

                        # Servislerin başlaması için bekle
                        echo "Backend ve Frontend başlatıldı, hazır olması bekleniyor..."
                        sleep 15

                        # Container durumlarını kontrol et
                        echo "📋 Container durumları:"
                        docker compose -p ${COMPOSE_PROJECT_NAME} ps

                        # App container kontrolü
                        APP_CONTAINER=$(docker compose -p ${COMPOSE_PROJECT_NAME} ps -q app)
                        if [ -z "$APP_CONTAINER" ]; then
                            echo "❌ Backend container bulunamadı!"
                            docker compose -p ${COMPOSE_PROJECT_NAME} logs app
                            exit 1
                        fi

                        # Frontend container kontrolü
                        FRONTEND_CONTAINER=$(docker compose -p ${COMPOSE_PROJECT_NAME} ps -q frontend)
                        if [ -z "$FRONTEND_CONTAINER" ]; then
                            echo "❌ Frontend container bulunamadı!"
                            docker compose -p ${COMPOSE_PROJECT_NAME} logs frontend
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
                        APP_CONTAINER=$(docker compose -p ${COMPOSE_PROJECT_NAME} ps -q app)
                        FRONTEND_CONTAINER=$(docker compose -p ${COMPOSE_PROJECT_NAME} ps -q frontend)

                        echo "Backend Container: $APP_CONTAINER"
                        echo "Frontend Container: $FRONTEND_CONTAINER"

                        # Backend hazır olana kadar bekle
                        echo "📦 Backend hazırlığı kontrol ediliyor..."
                        for i in {1..20}; do
                            if docker exec "$APP_CONTAINER" curl -f http://localhost:8081/actuator/health >/dev/null 2>&1; then
                                echo "✅ Backend hazır (${i}. deneme)"
                                break
                            fi
                            echo "⏳ Backend henüz hazır değil, bekleniyor... (${i}/20)"
                            sleep 3
                        done

                        # Frontend hazır olana kadar bekle
                        echo "🎨 Frontend hazırlığı kontrol ediliyor..."
                        for i in {1..15}; do
                            if curl -f http://localhost:5173 >/dev/null 2>&1; then
                                echo "✅ Frontend hazır (${i}. deneme)"
                                break
                            fi
                            echo "⏳ Frontend henüz hazır değil, bekleniyor... (${i}/15)"
                            sleep 4
                        done

                        # Son kontroller
                        if ! docker exec "$APP_CONTAINER" curl -f http://localhost:8081/actuator/health >/dev/null 2>&1; then
                            echo "❌ Backend hazır değil! Logları kontrol ediliyor..."
                            docker compose -p ${COMPOSE_PROJECT_NAME} logs app
                            exit 1
                        fi

                        if ! curl -f http://localhost:5173 >/dev/null 2>&1; then
                            echo "❌ Frontend hazır değil! Logları kontrol ediliyor..."
                            docker compose -p ${COMPOSE_PROJECT_NAME} logs frontend
                            exit 1
                        fi

                        # Unit testleri çalıştır - HATA DURUMUNDA PIPELINE DURDUR
                        echo "🔬 Unit testler çalıştırılıyor..."
                        if ! docker exec "$APP_CONTAINER" ./mvnw test -DskipSelenium=true -Dmaven.test.failure.ignore=false; then
                            echo "❌ Unit testler BAŞARISIZ! Pipeline durduruluyor."
                            docker compose -p ${COMPOSE_PROJECT_NAME} logs app
                            exit 1
                        fi
                        echo "✅ Unit testler başarılı"

                        # Integration testleri çalıştır - HATA DURUMUNDA PIPELINE DURDUR
                        echo "🔗 Integration testler çalıştırılıyor..."
                        if ! docker exec "$APP_CONTAINER" ./mvnw failsafe:integration-test failsafe:verify -DskipSelenium=true -Dmaven.test.failure.ignore=false; then
                            echo "❌ Integration testler BAŞARISIZ! Pipeline durduruluyor."
                            docker compose -p ${COMPOSE_PROJECT_NAME} logs app
                            exit 1
                        fi
                        echo "✅ Integration testler başarılı"

                        # Selenium testleri - Local Chrome ile Frontend'e karşı
                        echo "🌐 Selenium testler çalıştırılıyor (Frontend: http://localhost:5173)..."
                        if command -v chromedriver >/dev/null 2>&1; then
                            # Local'de Selenium testleri çalıştır - Frontend URL'ine karşı
                            ./mvnw test -Dtest="*SeleniumTest" \\
                                -Dwebdriver.chrome.driver=$(which chromedriver) \\
                                -Dapp.baseUrl=http://localhost:5173 \\
                                -Dmaven.test.failure.ignore=false \\
                                -Dselenium.headless=true || {
                                echo "❌ Selenium testler BAŞARISIZ! Pipeline durduruluyor."
                                echo "Frontend Logs:"
                                docker compose -p ${COMPOSE_PROJECT_NAME} logs frontend
                                echo "Backend Logs:"
                                docker compose -p ${COMPOSE_PROJECT_NAME} logs app
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
                        APP_CONTAINER=$(docker compose -p ${COMPOSE_PROJECT_NAME} ps -q app)

                        # Container'dan test sonuçlarını kopyala
                        echo "Docker container'dan test sonuçları kopyalanıyor..."
                        docker cp "$APP_CONTAINER:/app/target/surefire-reports" ./surefire-reports || echo "⚠️ Container'dan surefire reports kopyalanamadı"
                        docker cp "$APP_CONTAINER:/app/target/failsafe-reports" ./failsafe-reports || echo "⚠️ Container'dan failsafe reports kopyalanamadı"

                        # Local'den de test sonuçları al (Selenium için)
                        echo "Local test sonuçları kontrol ediliyor..."
                        if [ -d "./target/surefire-reports" ]; then
                            cp -r ./target/surefire-reports/* ./surefire-reports/ 2>/dev/null || true
                        fi
                        if [ -d "./target/failsafe-reports" ]; then
                            cp -r ./target/failsafe-reports/* ./failsafe-reports/ 2>/dev/null || true
                        fi

                        # Screenshots kopyala
                        docker cp "$APP_CONTAINER:/app/screenshots" ./screenshots || echo "⚠️ Screenshots bulunamadı"
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
                    docker compose -p ${COMPOSE_PROJECT_NAME} down --volumes --remove-orphans || true

                    # Local ortamda sadece bu build'e ait volume'ları temizle
                    docker volume ls -q | grep "${COMPOSE_PROJECT_NAME}" | xargs -r docker volume rm || true

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
