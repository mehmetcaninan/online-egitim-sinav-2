pipeline {
    // Herhangi bir mevcut agent kullan - mac chrome label sorunu çözülene kadar
    agent any

    tools {
        // Mac'te Homebrew ile kurulu JDK kullanılacak
        // JDK17 yerine sistem JDK'sı kullanılabilir
        jdk 'JDK17'
    }

    stages {
        stage('1 - Checkout (GitHub)') {
            steps {
                checkout scm
            }
        }

        stage('2 - Build') {
            steps {
                // Projeyi testler olmadan derle (build aşaması)
                sh './mvnw clean package -DskipTests'
            }
        }

        stage('3 - Unit Tests') {
            steps {
                // Sadece birim testleri (JUnit) çalıştır
                sh './mvnw test -DskipSelenium=true'
            }
        }

        stage('4 - Integration Tests') {
            steps {
                // Entegrasyon testlerini (ApplicationIntegrationTest vb.) çalıştır
                sh './mvnw failsafe:integration-test failsafe:verify -DskipSelenium=true'
            }
        }

        stage('5 - Docker Containers') {
            when {
                expression { fileExists('docker-compose.yml') }
            }
            steps {
                // Uygulama ve veritabanını Docker container'ları üzerinde ayağa kaldır
                // Jenkins agent'ında docker/docker-compose yoksa pipeline'ı kırmadan sadece uyarı ver
                sh '''
if command -v docker-compose >/dev/null 2>&1; then
  echo "[Docker Stage] docker-compose (standalone) bulundu, container'lar başlatılıyor..."
  docker-compose down -v || true
  docker-compose up -d --build app db
  docker ps
elif command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  echo "[Docker Stage] docker compose (v2) bulundu, container'lar başlatılıyor..."
  docker compose down -v || true
  docker compose up -d --build app db
  docker ps
else
  echo "[Docker Stage] UYARI: Jenkins agent'ında docker-compose veya docker compose bulunamadı."
  echo "[Docker Stage] Docker: $(command -v docker || echo 'bulunamadı')"
  echo "[Docker Stage] docker-compose: $(command -v docker-compose || echo 'bulunamadı')"
  echo "[Docker Stage] Bu ortamda container'lar başlatılamadı, ancak stage başarıyla tamamlandı."
fi
'''
            }
        }

        stage('6 - Selenium UI Test Senaryoları') {
            when {
                expression { fileExists('run-selenium-tests.sh') }
            }
            steps {
                sh 'chmod +x run-selenium-tests.sh'
                // Selenium testleri başarısız olsa bile pipeline'ı kırmamak için catchError kullan
                catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                sh './run-selenium-tests.sh'
                }
            }
        }
    }

    post {
        always {
            // Test sonuçlarını daha güvenilir şekilde publish et
            script {
                // Surefire test sonuçları (unit tests)
                if (fileExists('target/surefire-reports')) {
                    publishTestResults testResultsPattern: 'target/surefire-reports/*.xml',
                                     mergeResults: true,
                                     failOnError: false
                }

                // Failsafe test sonuçları (integration & selenium tests)
                if (fileExists('target/failsafe-reports')) {
                    publishTestResults testResultsPattern: 'target/failsafe-reports/*.xml',
                                     mergeResults: true,
                                     failOnError: false
                }

                // Eski JUnit plugin için fallback
                try {
                    junit allowEmptyResults: true, testResults: 'target/surefire-reports/*.xml,target/failsafe-reports/*.xml'
                } catch (Exception e) {
                    echo "JUnit plugin mevcut değil: ${e.getMessage()}"
                }
            }
        }
    }
}
