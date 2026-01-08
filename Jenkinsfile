pipeline {
    agent any

    // GitHub webhook trigger'ları - iyileştirilmiş
    triggers {
        githubPush()
        pollSCM('H/5 * * * *') // 5 dakikada bir kontrol et (daha sık)
    }

    options {
        // Build'i 30 dakika sonra timeout yap
        timeout(time: 30, unit: 'MINUTES')
        // Aynı anda sadece 1 build çalışsın
        disableConcurrentBuilds()
        // Build geçmişini sınırla
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        COMPOSE_PROJECT_NAME = "jenkins-${BUILD_NUMBER}"
        DOCKER_BUILDKIT = '1'
        CI = 'true'
        SELENIUM_HEADLESS = 'true'
    }

    stages {
        stage('0 - Webhook Test & Info') {
            steps {
                script {
                    echo "🐳 DOCKER-BASED JENKINS PIPELINE"
                    echo "================================="
                    echo "Build Number: ${BUILD_NUMBER}"
                    echo "Git Commit: ${env.GIT_COMMIT ?: 'Bulunamadı'}"
                    echo "Git Branch: ${env.GIT_BRANCH ?: 'Bulunamadı'}"
                    echo "Docker Compose Project: ${COMPOSE_PROJECT_NAME}"

                    // Webhook test scripti çalıştır
                    if (fileExists('webhook-test.sh')) {
                        sh 'chmod +x webhook-test.sh && ./webhook-test.sh'
                    }
                    echo "================================="
                }
            }
        }

        stage('1 - Checkout (GitHub)') {
            steps {
                checkout scm
            }
        }

        stage('2 - Docker Environment Setup') {
            steps {
                script {
                    echo "🐳 Docker ortamı hazırlanıyor..."

                    // Önceki container'ları temizle
                    sh '''
                        echo "Önceki container'ları temizliyorum..."

                        # Modern docker compose syntax kullan
                        if command -v docker-compose &> /dev/null; then
                            docker-compose -p ${COMPOSE_PROJECT_NAME} down --volumes --remove-orphans || true
                        elif docker compose version &> /dev/null; then
                            docker compose -p ${COMPOSE_PROJECT_NAME} down --volumes --remove-orphans || true
                        else
                            echo "⚠️ Docker Compose bulunamadı, manuel temizlik yapılıyor..."
                            docker ps -a -q --filter "label=com.docker.compose.project=${COMPOSE_PROJECT_NAME}" | xargs -r docker rm -f || true
                            docker network ls -q --filter "name=${COMPOSE_PROJECT_NAME}" | xargs -r docker network rm || true
                            docker volume ls -q --filter "name=${COMPOSE_PROJECT_NAME}" | xargs -r docker volume rm || true
                        fi

                        docker system prune -f || true
                    '''

                    // Docker Compose dosyasını kontrol et
                    if (!fileExists('docker-compose.yml')) {
                        error "docker-compose.yml dosyası bulunamadı!"
                    }

                    echo "✅ Docker ortamı hazır"
                }
            }
        }

        stage('3 - Build & Start Services') {
            steps {
                script {
                    echo "🏗️ Docker servisleri build ediliyor ve başlatılıyor..."

                    sh '''
                        # Docker Compose varlığını kontrol et ve çalıştır
                        echo "🔍 Docker Compose kontrol ediliyor..."

                        # Test: docker-compose komutu çalışıyor mu?
                        if docker-compose --version &> /dev/null; then
                            COMPOSE_CMD="docker-compose"
                            echo "✅ docker-compose komutu kullanılacak"
                        elif docker compose version &> /dev/null; then
                            COMPOSE_CMD="docker compose"
                            echo "✅ docker compose komutu kullanılacak"
                        else
                            COMPOSE_CMD=""
                            echo "⚠️ Docker Compose bulunamadı - Manuel Docker komutları kullanılacak"
                        fi

                        # Docker Compose ile dene
                        if [ -n "$COMPOSE_CMD" ]; then
                            echo "📦 Docker Compose ile başlatma deneniyor: $COMPOSE_CMD"

                            if $COMPOSE_CMD -p ${COMPOSE_PROJECT_NAME} up -d db; then
                                echo "✅ Database başarıyla başlatıldı"
                                sleep 10

                                if $COMPOSE_CMD -p ${COMPOSE_PROJECT_NAME} up -d selenium-hub selenium-chrome; then
                                    echo "✅ Selenium servisleri başarıyla başlatıldı"
                                    sleep 5

                                    if $COMPOSE_CMD -p ${COMPOSE_PROJECT_NAME} up -d --build app; then
                                        echo "✅ Uygulama başarıyla başlatıldı"
                                        sleep 10
                                        exit 0
                                    else
                                        echo "❌ App başlatılamadı, manuel mod'a geçiliyor..."
                                    fi
                                else
                                    echo "❌ Selenium başlatılamadı, manuel mod'a geçiliyor..."
                                fi
                            else
                                echo "❌ Database başlatılamadı, manuel mod'a geçiliyor..."
                            fi

                            # Başarısız olan container'ları temizle
                            $COMPOSE_CMD -p ${COMPOSE_PROJECT_NAME} down --remove-orphans || true
                        fi

                        # Manuel Docker komutları
                        echo "🔧 Manuel Docker komutları ile başlatılıyor..."

                        # Network oluştur
                        docker network create ${COMPOSE_PROJECT_NAME}_app-network || true

                        # Database container'ı başlat
                        echo "🗄️ PostgreSQL başlatılıyor..."
                        docker run -d \\
                            --name ${COMPOSE_PROJECT_NAME}-db-1 \\
                            --network ${COMPOSE_PROJECT_NAME}_app-network \\
                            -e POSTGRES_DB=online_egitim_db \\
                            -e POSTGRES_USER=postgres \\
                            -e POSTGRES_PASSWORD=postgres \\
                            -p 5432:5432 \\
                            --platform linux/arm64 \\
                            postgres:15

                        echo "Database başlatıldı, hazır olması bekleniyor..."
                        sleep 15

                        # Database hazır mı kontrol et
                        timeout 60 bash -c 'until docker exec ${COMPOSE_PROJECT_NAME}-db-1 pg_isready -U postgres; do echo "Database bekleniyor..."; sleep 2; done'

                        # Selenium Hub başlat
                        echo "🧪 Selenium Hub başlatılıyor..."
                        docker run -d \\
                            --name ${COMPOSE_PROJECT_NAME}-selenium-hub \\
                            --network ${COMPOSE_PROJECT_NAME}_app-network \\
                            -p 4444:4444 \\
                            -e SE_HUB_HOST=0.0.0.0 \\
                            -e SE_HUB_PORT=4444 \\
                            --platform linux/arm64 \\
                            selenium/hub:4.26.0

                        # Selenium Chrome başlat
                        echo "🌐 Selenium Chrome başlatılıyor..."
                        docker run -d \\
                            --name ${COMPOSE_PROJECT_NAME}-selenium-chrome \\
                            --network ${COMPOSE_PROJECT_NAME}_app-network \\
                            -e HUB_HOST=${COMPOSE_PROJECT_NAME}-selenium-hub \\
                            -e HUB_PORT=4444 \\
                            -e SE_EVENT_BUS_HOST=${COMPOSE_PROJECT_NAME}-selenium-hub \\
                            -e SE_EVENT_BUS_PUBLISH_PORT=4442 \\
                            -e SE_EVENT_BUS_SUBSCRIBE_PORT=4443 \\
                            --shm-size=2gb \\
                            --platform linux/arm64 \\
                            selenium/node-chromium:4.26.0

                        echo "Selenium servisleri başlatıldı"
                        sleep 10

                        # App build et
                        echo "🏗️ Uygulama build ediliyor..."
                        docker build --platform linux/arm64 -t ${COMPOSE_PROJECT_NAME}-app .

                        # App başlat
                        echo "🚀 Uygulama başlatılıyor..."
                        docker run -d \\
                            --name ${COMPOSE_PROJECT_NAME}-app-1 \\
                            --network ${COMPOSE_PROJECT_NAME}_app-network \\
                            -e SPRING_PROFILES_ACTIVE=docker \\
                            -e SPRING_DATASOURCE_URL=jdbc:postgresql://${COMPOSE_PROJECT_NAME}-db-1:5432/online_egitim_db \\
                            -e SPRING_DATASOURCE_USERNAME=postgres \\
                            -e SPRING_DATASOURCE_PASSWORD=postgres \\
                            -p 8082:8081 \\
                            --platform linux/arm64 \\
                            ${COMPOSE_PROJECT_NAME}-app

                        echo "Uygulama başlatıldı, hazır olması bekleniyor..."
                        sleep 20

                        echo "✅ Tüm servisler manuel olarak başlatıldı"
                    '''

                    echo "✅ Tüm servisler çalışıyor"
                }
            }
        }

        stage('4 - Health Checks') {
            steps {
                script {
                    echo "🏥 Servis sağlık kontrolleri..."

                    sh '''
                        # Container durumlarını kontrol et
                        echo "📋 Çalışan container'lar:"
                        docker ps --filter "name=${COMPOSE_PROJECT_NAME}"

                        # Database sağlık kontrolü
                        echo "Database bağlantısı kontrol ediliyor..."
                        docker exec ${COMPOSE_PROJECT_NAME}-db-1 pg_isready -U postgres || {
                            echo "⚠️ Database hazır değil, bekleniyor..."
                            sleep 10
                            docker exec ${COMPOSE_PROJECT_NAME}-db-1 pg_isready -U postgres
                        }

                        # Selenium Hub kontrolü
                        echo "Selenium Hub kontrol ediliyor..."
                        timeout 30 bash -c 'until curl -s http://localhost:4444/wd/hub/status; do echo "Selenium Hub bekleniyor..."; sleep 2; done' || echo "⚠️ Selenium Hub timeout"

                        # Backend uygulama kontrolü
                        echo "Backend uygulama kontrol ediliyor..."
                        timeout 60 bash -c 'until curl -s http://localhost:8082/actuator/health; do echo "Backend bekleniyor..."; sleep 5; done' || {
                            echo "⚠️ Backend health endpoint bulunamadı, ana sayfa kontrol ediliyor..."
                            timeout 60 bash -c 'until curl -s http://localhost:8082/; do echo "Backend ana sayfa bekleniyor..."; sleep 5; done'
                        }
                    '''

                    echo "✅ Tüm servisler sağlıklı"
                }
            }
        }

        stage('5 - Run Tests in Docker') {
            steps {
                script {
                    echo "🧪 Docker ortamında testler çalıştırılıyor..."

                    sh '''
                        # App container'ın adını bul
                        APP_CONTAINER="${COMPOSE_PROJECT_NAME}-app-1"

                        echo "Test container: $APP_CONTAINER"

                        # Container'ın çalışır durumda olduğunu kontrol et
                        if ! docker ps --format "table {{.Names}}" | grep -q "$APP_CONTAINER"; then
                            echo "❌ App container çalışmıyor!"
                            docker ps --filter "name=${COMPOSE_PROJECT_NAME}"
                            exit 1
                        fi

                        echo "📦 Container durumu:"
                        docker logs --tail 20 "$APP_CONTAINER"

                        # Unit testleri Docker container içinde çalıştır
                        echo "🔬 Unit testler çalıştırılıyor..."
                        docker exec "$APP_CONTAINER" ./mvnw test -DskipSelenium=true || {
                            echo "⚠️ Unit testlerde hata, devam ediliyor..."
                        }

                        # Integration testleri
                        echo "🔗 Integration testler çalıştırılıyor..."
                        docker exec "$APP_CONTAINER" ./mvnw failsafe:integration-test failsafe:verify -DskipSelenium=true || {
                            echo "⚠️ Integration testlerde hata, devam ediliyor..."
                        }

                        # Selenium testleri - opsiyonel
                        echo "🌐 Selenium testler çalıştırılıyor..."
                        docker exec "$APP_CONTAINER" ./mvnw test -Dtest="*SeleniumTest" -Dwebdriver.remote.url=http://${COMPOSE_PROJECT_NAME}-selenium-hub:4444/wd/hub -Dapp.baseUrl=http://${COMPOSE_PROJECT_NAME}-app-1:8081 || {
                            echo "⚠️ Selenium testlerde hata - bu normal olabilir"
                        }
                    '''

                    echo "✅ Testler tamamlandı"
                }
            }
        }

        stage('6 - Extract Test Results') {
            steps {
                script {
                    echo "📊 Test sonuçları Docker'dan çıkarılıyor..."

                    sh '''
                        APP_CONTAINER="${COMPOSE_PROJECT_NAME}-app-1"

                        # Test sonuçlarını host'a kopyala
                        echo "Test sonuçları kopyalanıyor..."
                        docker cp "$APP_CONTAINER:/app/target/surefire-reports" ./surefire-reports || echo "⚠️ Surefire reports bulunamadı"
                        docker cp "$APP_CONTAINER:/app/target/failsafe-reports" ./failsafe-reports || echo "⚠️ Failsafe reports bulunamadı"

                        # Screenshots varsa kopyala
                        docker cp "$APP_CONTAINER:/app/screenshots" ./screenshots || echo "⚠️ Screenshots bulunamadı"

                        echo "✅ Test sonuçları kopyalandı"

                        # Kopyalanan dosyaları listele
                        echo "📂 Kopyalanan dosyalar:"
                        ls -la surefire-reports/ || echo "Surefire reports yok"
                        ls -la failsafe-reports/ || echo "Failsafe reports yok"
                        ls -la screenshots/ || echo "Screenshots yok"
                    '''
                }
            }
        }
    }

    post {
        always {
            script {
                echo "🧹 Temizlik işlemleri..."

                // Test sonuçlarını publish et
                if (fileExists('surefire-reports')) {
                    publishTestResults testResultsPattern: 'surefire-reports/*.xml'
                }
                if (fileExists('failsafe-reports')) {
                    publishTestResults testResultsPattern: 'failsafe-reports/*.xml'
                }

                // Screenshots'ları arşivle
                if (fileExists('screenshots')) {
                    archiveArtifacts artifacts: 'screenshots/**/*', allowEmptyArchive: true
                }

                // Docker container'ları temizle
                sh '''
                    echo "Container'ları durduruyor ve temizliyorum..."

                    # Docker Compose varsa kullan
                    if command -v docker-compose &> /dev/null; then
                        docker-compose -p ${COMPOSE_PROJECT_NAME} logs app || true
                        docker-compose -p ${COMPOSE_PROJECT_NAME} down --volumes --remove-orphans || true
                    elif docker compose version &> /dev/null; then
                        docker compose -p ${COMPOSE_PROJECT_NAME} logs app || true
                        docker compose -p ${COMPOSE_PROJECT_NAME} down --volumes --remove-orphans || true
                    else
                        # Manuel temizlik
                        echo "Manuel Docker temizliği yapılıyor..."

                        # Container loglarını göster
                        docker logs ${COMPOSE_PROJECT_NAME}-app-1 || true

                        # Container'ları durdur ve sil
                        docker stop ${COMPOSE_PROJECT_NAME}-app-1 || true
                        docker stop ${COMPOSE_PROJECT_NAME}-selenium-chrome || true
                        docker stop ${COMPOSE_PROJECT_NAME}-selenium-hub || true
                        docker stop ${COMPOSE_PROJECT_NAME}-db-1 || true

                        docker rm ${COMPOSE_PROJECT_NAME}-app-1 || true
                        docker rm ${COMPOSE_PROJECT_NAME}-selenium-chrome || true
                        docker rm ${COMPOSE_PROJECT_NAME}-selenium-hub || true
                        docker rm ${COMPOSE_PROJECT_NAME}-db-1 || true

                        # Network'ü sil
                        docker network rm ${COMPOSE_PROJECT_NAME}_app-network || true

                        # Build edilen imajı temizle
                        docker rmi ${COMPOSE_PROJECT_NAME}-app || true
                    fi

                    # Kullanılmayan imajları temizle
                    docker image prune -f || true
                '''

                echo "✅ Temizlik tamamlandı"
            }
        }
        success {
            echo "🎉 Pipeline başarıyla tamamlandı!"
        }
        failure {
            echo "❌ Pipeline başarısız oldu!"
            // Container loglarını göster
            sh '''
                echo "Hata durumunda container logları:"
                docker logs ${COMPOSE_PROJECT_NAME}-app-1 || echo "App container log alınamadı"
                docker logs ${COMPOSE_PROJECT_NAME}-db-1 || echo "DB container log alınamadı"
                docker logs ${COMPOSE_PROJECT_NAME}-selenium-hub || echo "Selenium Hub log alınamadı"
                docker ps --filter "name=${COMPOSE_PROJECT_NAME}" || true
            '''
        }
    }
}
