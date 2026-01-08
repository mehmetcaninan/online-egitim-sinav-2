pipeline {
    agent any

    triggers {
        githubPush()
    }

    options {
        timeout(time: 15, unit: 'MINUTES') // Kısa timeout
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
                        echo "Önceki container'ları temizliyorum..."

                        # Sadece jenkins ile ilgili container'ları temizle
                        docker ps -a | grep "jenkins-ci" | awk '{print $1}' | xargs -r docker rm -f || true

                        # Sadece dangling image'ları temizle - mevcut image'ları koru
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

                        # Sadece backend servisi için build ve start (frontend ve db'yi skip et)
                        docker-compose -p ${COMPOSE_PROJECT_NAME} build --parallel app

                        # Sadece gerekli servisleri başlat
                        docker-compose -p ${COMPOSE_PROJECT_NAME} up -d app db

                        # Kısa bekleme - servislerin başlaması için
                        echo "Servisler başlatıldı, hazır olması bekleniyor..."
                        sleep 8

                        # Container durumunu kontrol et
                        echo "📋 Container durumları:"
                        docker-compose -p ${COMPOSE_PROJECT_NAME} ps

                        # App container'ın çalıştığını doğrula
                        APP_CONTAINER=$(docker-compose -p ${COMPOSE_PROJECT_NAME} ps -q app)
                        if [ -z "$APP_CONTAINER" ]; then
                            echo "❌ App container bulunamadı!"
                            docker-compose -p ${COMPOSE_PROJECT_NAME} logs app
                            exit 1
                        fi

                        # DB container'ın çalıştığını doğrula
                        DB_CONTAINER=$(docker-compose -p ${COMPOSE_PROJECT_NAME} ps -q db)
                        if [ -z "$DB_CONTAINER" ]; then
                            echo "❌ DB container bulunamadı!"
                            docker-compose -p ${COMPOSE_PROJECT_NAME} logs db
                            exit 1
                        fi

                        echo "✅ Servisler başarıyla çalışıyor"
                        echo "App Container ID: $APP_CONTAINER"
                        echo "DB Container ID: $DB_CONTAINER"
                    '''
                }
            }
        }

        stage('4 - Wait for Services & Run Tests') {
            steps {
                script {
                    echo "🧪 Servis hazırlığı kontrol ediliyor ve testler çalıştırılıyor..."

                    sh '''
                        APP_CONTAINER=$(docker-compose -p ${COMPOSE_PROJECT_NAME} ps -q app)

                        echo "Test container: $APP_CONTAINER"

                        # DB hazır olana kadar bekle
                        echo "📦 Database hazırlığı kontrol ediliyor..."
                        for i in {1..12}; do
                            if docker-compose -p ${COMPOSE_PROJECT_NAME} exec -T db pg_isready -U postgres >/dev/null 2>&1; then
                                echo "✅ Database hazır (${i}. deneme)"
                                break
                            fi
                            echo "⏳ Database henüz hazır değil, bekleniyor... (${i}/12)"
                            sleep 3
                        done

                        # Backend hazır olana kadar bekle
                        echo "📦 Backend hazırlığı kontrol ediliyor..."
                        for i in {1..10}; do
                            if docker exec "$APP_CONTAINER" curl -f http://localhost:8081/actuator/health >/dev/null 2>&1; then
                                echo "✅ Backend hazır (${i}. deneme)"
                                break
                            fi
                            echo "⏳ Backend henüz hazır değil, bekleniyor... (${i}/10)"
                            sleep 4
                        done

                        # Son kontrol
                        if ! docker exec "$APP_CONTAINER" curl -f http://localhost:8081/actuator/health >/dev/null 2>&1; then
                            echo "❌ Backend hazır değil! Logları kontrol ediliyor..."
                            docker-compose -p ${COMPOSE_PROJECT_NAME} logs app
                            exit 1
                        fi

                        # Unit testleri çalıştır - HATA DURUMUNDA PIPELINE DURDUR
                        echo "🔬 Unit testler çalıştırılıyor..."
                        if ! docker exec "$APP_CONTAINER" ./mvnw test -DskipSelenium=true -Dmaven.test.failure.ignore=false; then
                            echo "❌ Unit testler BAŞARISIZ! Pipeline durduruluyor."
                            docker-compose -p ${COMPOSE_PROJECT_NAME} logs app
                            exit 1
                        fi
                        echo "✅ Unit testler başarılı"

                        # Integration testleri çalıştır - HATA DURUMUNDA PIPELINE DURDUR
                        echo "🔗 Integration testler çalıştırılıyor..."
                        if ! docker exec "$APP_CONTAINER" ./mvnw failsafe:integration-test failsafe:verify -DskipSelenium=true -Dmaven.test.failure.ignore=false; then
                            echo "❌ Integration testler BAŞARISIZ! Pipeline durduruluyor."
                            docker-compose -p ${COMPOSE_PROJECT_NAME} logs app
                            exit 1
                        fi
                        echo "✅ Integration testler başarılı"

                        # Selenium testleri - HATA DURUMUNDA PIPELINE DURDUR
                        echo "🌐 Selenium testler çalıştırılıyor..."
                        if ! docker exec "$APP_CONTAINER" ./mvnw test -Dtest="*SeleniumTest" -Dwebdriver.chrome.driver=/usr/bin/chromedriver -Dapp.baseUrl=http://localhost:8081 -Dmaven.test.failure.ignore=false; then
                            echo "❌ Selenium testler BAŞARISIZ! Pipeline durduruluyor."
                            docker-compose -p ${COMPOSE_PROJECT_NAME} logs app
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
                        APP_CONTAINER=$(docker-compose -p ${COMPOSE_PROJECT_NAME} ps -q app)

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

                // Test sonuçlarını publish et
                try {
                    if (fileExists('surefire-reports')) {
                        publishTestResults testResultsPattern: 'surefire-reports/*.xml'
                        echo "📊 Unit test sonuçları Jenkins'e yüklendi"
                    }
                    if (fileExists('failsafe-reports')) {
                        publishTestResults testResultsPattern: 'failsafe-reports/*.xml'
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
                    docker-compose -p ${COMPOSE_PROJECT_NAME} down --volumes --remove-orphans || true

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
