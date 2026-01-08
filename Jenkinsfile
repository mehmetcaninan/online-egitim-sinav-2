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
                        docker-compose -p ${COMPOSE_PROJECT_NAME} down --volumes --remove-orphans || true
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
                        # Database'i önce başlat
                        docker-compose -p ${COMPOSE_PROJECT_NAME} up -d db
                        echo "Database başlatıldı, bekleniyor..."
                        sleep 10

                        # Selenium Hub'ı başlat
                        docker-compose -p ${COMPOSE_PROJECT_NAME} up -d selenium-hub selenium-chrome
                        echo "Selenium servisleri başlatıldı"
                        sleep 5

                        # Ana uygulamayı build et ve başlat
                        docker-compose -p ${COMPOSE_PROJECT_NAME} up -d --build app
                        echo "Uygulama başlatıldı"
                        sleep 10
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
                        docker-compose -p ${COMPOSE_PROJECT_NAME} ps

                        # Database sağlık kontrolü
                        echo "Database bağlantısı kontrol ediliyor..."
                        docker-compose -p ${COMPOSE_PROJECT_NAME} exec -T db pg_isready -U postgres

                        # Selenium Hub kontrolü
                        echo "Selenium Hub kontrol ediliyor..."
                        timeout 30 bash -c 'until curl -s http://localhost:4444/wd/hub/status; do sleep 2; done'

                        # Backend uygulama kontrolü
                        echo "Backend uygulama kontrol ediliyor..."
                        timeout 60 bash -c 'until curl -s http://localhost:8082/actuator/health; do sleep 5; done'
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
                        # Unit testleri Docker container içinde çalıştır
                        docker-compose -p ${COMPOSE_PROJECT_NAME} exec -T app ./mvnw test -DskipSelenium=true

                        # Integration testleri
                        docker-compose -p ${COMPOSE_PROJECT_NAME} exec -T app ./mvnw failsafe:integration-test failsafe:verify -DskipSelenium=true

                        # Selenium testleri Docker Selenium Hub ile
                        docker-compose -p ${COMPOSE_PROJECT_NAME} exec -T app ./mvnw test -Dtest="*SeleniumTest" -Dwebdriver.remote.url=http://selenium-hub:4444/wd/hub -Dapp.baseUrl=http://app:8081
                    '''

                    echo "✅ Tüm testler başarılı"
                }
            }
        }

        stage('6 - Extract Test Results') {
            steps {
                script {
                    echo "📊 Test sonuçları Docker'dan çıkarılıyor..."

                    sh '''
                        # Test sonuçlarını host'a kopyala
                        docker cp $(docker-compose -p ${COMPOSE_PROJECT_NAME} ps -q app):/app/target/surefire-reports ./surefire-reports || true
                        docker cp $(docker-compose -p ${COMPOSE_PROJECT_NAME} ps -q app):/app/target/failsafe-reports ./failsafe-reports || true

                        # Screenshots varsa kopyala
                        docker cp $(docker-compose -p ${COMPOSE_PROJECT_NAME} ps -q app):/app/screenshots ./screenshots || true

                        echo "Test sonuçları kopyalandı"
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
                    docker-compose -p ${COMPOSE_PROJECT_NAME} logs app || true
                    docker-compose -p ${COMPOSE_PROJECT_NAME} down --volumes --remove-orphans || true

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
            sh 'docker-compose -p ${COMPOSE_PROJECT_NAME} logs || true'
        }
    }
}
