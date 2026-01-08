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
        COMPOSE_PROJECT_NAME = "jenkins-ci-${BUILD_NUMBER}"
        DOCKER_BUILDKIT = '1'
        CI = 'true'
        SELENIUM_HEADLESS = 'true'
    }

    stages {
        stage('1 - Checkout & Info') {
            steps {
                script {
                    echo "🐳 DOCKER-COMPOSE JENKINS PIPELINE"
                    echo "================================="
                    echo "Build Number: ${BUILD_NUMBER}"
                    echo "Git Branch: ${env.GIT_BRANCH ?: 'main'}"
                    echo "Docker Compose Project: ${COMPOSE_PROJECT_NAME}"

                    checkout scm

                    if (fileExists('webhook-test.sh')) {
                        sh 'chmod +x webhook-test.sh && ./webhook-test.sh || true'
                    }
                    echo "================================="
                }
            }
        }

        stage('2 - Docker Environment Setup') {
            steps {
                script {
                    echo "🐳 Docker ortamı hazırlanıyor..."

                    sh '''
                        echo "Docker Compose kurulumunu kontrol ediyorum..."

                        # Docker Compose V2 kontrolü
                        if ! docker compose version >/dev/null 2>&1; then
                            echo "❌ Docker Compose V2 bulunamadı, kurulum yapılıyor..."

                            # Docker Compose V2 kurulum
                            DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
                            mkdir -p $DOCKER_CONFIG/cli-plugins

                            # Download latest docker-compose
                            curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o $DOCKER_CONFIG/cli-plugins/docker-compose
                            chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose

                            echo "✅ Docker Compose V2 kuruldu"
                        else
                            echo "✅ Docker Compose V2 mevcut"
                        fi

                        # Docker BuildX kurulum kontrolü - Versiyon gereksinimi: 0.17+
                        echo "Docker BuildX kurulumunu kontrol ediyorum..."

                        BUILDX_REQUIRED_VERSION="0.17"
                        CURRENT_BUILDX_VERSION=""

                        if docker buildx version >/dev/null 2>&1; then
                            CURRENT_BUILDX_VERSION=$(docker buildx version | grep buildx | cut -d' ' -f2 | cut -d'v' -f2 | cut -d'+' -f1)
                            echo "Mevcut BuildX versiyonu: $CURRENT_BUILDX_VERSION"
                        fi

                        # Version karşılaştırması yapmak yerine her zaman yeni versiyonu kur
                        echo "❌ BuildX 0.17+ gerekiyor, yeni versiyon kuruluyor..."

                        # BuildX kurulum
                        DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
                        mkdir -p $DOCKER_CONFIG/cli-plugins

                        # Download BuildX v0.17.1 (kesin versiyon)
                        curl -SL https://github.com/docker/buildx/releases/download/v0.17.1/buildx-v0.17.1.linux-amd64 -o $DOCKER_CONFIG/cli-plugins/docker-buildx
                        chmod +x $DOCKER_CONFIG/cli-plugins/docker-buildx

                        echo "✅ Docker BuildX v0.17.1 kuruldu"

                        # Versiyonları doğrula
                        echo "📋 Kurulu versiyonlar:"
                        docker compose version
                        docker buildx version

                        echo "Önceki container'ları temizliyorum..."

                        # Sadece jenkins ile ilgili container'ları temizle
                        docker ps -a | grep "jenkins-ci" | awk '{print $1}' | xargs -r docker rm -f || true

                        # Sadece dangling image'ları temizle
                        docker image prune -f || true

                        # Network temizliği
                        docker network prune -f || true
                    '''

                    if (!fileExists('docker-compose.yml')) {
                        error "docker-compose.yml dosyası bulunamadı!"
                    }

                    echo "✅ Docker ortamı hazırlandı"
                }
            }
        }

        stage('3 - Build & Start Services') {
            steps {
                script {
                    echo "🏗️ Docker Compose ile servisler başlatılıyor..."

                    sh '''
                        echo "🔧 Docker Compose build ve start..."

                        # Docker Compose V2 syntax kullan
                        docker compose -p ${COMPOSE_PROJECT_NAME} build --parallel app

                        # Sadece gerekli servisleri başlat
                        docker compose -p ${COMPOSE_PROJECT_NAME} up -d app

                        # Kısa bekleme - servislerin başlaması için
                        echo "Servisler başlatıldı, hazır olması bekleniyor..."
                        sleep 8

                        # Container durumunu kontrol et
                        echo "📋 Container durumları:"
                        docker compose -p ${COMPOSE_PROJECT_NAME} ps

                        # App container'ın çalıştığını doğrula
                        APP_CONTAINER=$(docker compose -p ${COMPOSE_PROJECT_NAME} ps -q app)
                        if [ -z "$APP_CONTAINER" ]; then
                            echo "❌ App container bulunamadı!"
                            docker compose -p ${COMPOSE_PROJECT_NAME} logs app
                            exit 1
                        fi

                        echo "✅ Servis başarıyla çalışıyor"
                        echo "App Container ID: $APP_CONTAINER"
                    '''
                }
            }
        }

        stage('4 - Wait for Services & Run Tests') {
            steps {
                script {
                    echo "🧪 Servis hazırlığı kontrol ediliyor ve testler çalıştırılıyor..."

                    sh '''
                        APP_CONTAINER=$(docker compose -p ${COMPOSE_PROJECT_NAME} ps -q app)

                        echo "Test container: $APP_CONTAINER"

                        # Backend hazır olana kadar bekle - H2 DB kullanıldığından DB kontrol gereksiz
                        echo "📦 Backend hazırlığı kontrol ediliyor..."
                        for i in {1..15}; do
                            if docker exec "$APP_CONTAINER" curl -f http://localhost:8081/actuator/health >/dev/null 2>&1; then
                                echo "✅ Backend hazır (${i}. deneme)"
                                break
                            fi
                            echo "⏳ Backend henüz hazır değil, bekleniyor... (${i}/15)"
                            sleep 3
                        done

                        # Son kontrol
                        if ! docker exec "$APP_CONTAINER" curl -f http://localhost:8081/actuator/health >/dev/null 2>&1; then
                            echo "❌ Backend hazır değil! Logları kontrol ediliyor..."
                            docker compose -p ${COMPOSE_PROJECT_NAME} logs app
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

                        # Selenium testleri - HATA DURUMUNDA PIPELINE DURDUR
                        echo "🌐 Selenium testler çalıştırılıyor..."
                        if ! docker exec "$APP_CONTAINER" ./mvnw test -Dtest="*SeleniumTest" -Dwebdriver.chrome.driver=/usr/bin/chromedriver -Dapp.baseUrl=http://localhost:8081 -Dmaven.test.failure.ignore=false; then
                            echo "❌ Selenium testler BAŞARISIZ! Pipeline durduruluyor."
                            docker compose -p ${COMPOSE_PROJECT_NAME} logs app
                            exit 1
                        fi
                        echo "✅ Selenium testler başarılı"
                    '''

                    echo "✅ Tüm testler başarıyla tamamlandı"
                }
            }
        }

        stage('5 - Extract Test Results') {
            steps {
                script {
                    echo "📊 Test sonuçları Docker'dan çıkarılıyor..."

                    sh '''
                        APP_CONTAINER=$(docker compose -p ${COMPOSE_PROJECT_NAME} ps -q app)

                        # Test sonuçlarını host'a kopyala
                        echo "Test sonuçları kopyalanıyor..."
                        docker cp "$APP_CONTAINER:/app/target/surefire-reports" ./surefire-reports || echo "⚠️ Surefire reports bulunamadı"
                        docker cp "$APP_CONTAINER:/app/target/failsafe-reports" ./failsafe-reports || echo "⚠️ Failsafe reports bulunamadı"
                        docker cp "$APP_CONTAINER:/app/screenshots" ./screenshots || echo "⚠️ Screenshots bulunamadı"

                        echo "✅ Test sonuçları kopyalandı"

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
                echo "🧹 Temizlik işlemleri başlatılıyor..."

                // Test sonuçlarını publish et - Doğru JUnit syntax
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

                // Docker temizliği
                sh '''
                    echo "🐳 Docker container'ları temizleniyor..."
                    docker compose -p ${COMPOSE_PROJECT_NAME} down --volumes --remove-orphans || true

                    # Sadece bu build'e ait volume'ları temizle
                    docker volume ls -q | grep "${COMPOSE_PROJECT_NAME}" | xargs -r docker volume rm || true

                    echo "✅ Docker temizliği tamamlandı"
                '''
            }
        }

        success {
            echo "🎉 Pipeline BAŞARILI! Tüm testler geçti."
        }

        failure {
            echo "❌ Pipeline BAŞARISIZ! Hatalar var, lütfen kontrol edin."
        }
    }
}
