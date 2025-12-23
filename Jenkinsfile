pipeline {
    agent any

    tools {
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
  echo "[Docker Stage] docker-compose bulundu, container'lar başlatılıyor..."
  docker-compose down -v || true
  docker-compose up -d --build app db
  docker ps
elif command -v docker >/dev/null 2>&1; then
  echo "[Docker Stage] docker compose (v2) bulundu, container'lar başlatılıyor..."
  docker compose down -v || true
  docker compose up -d --build app db
  docker ps
else
  echo "[Docker Stage] UYARI: Jenkins agent'ında docker/docker-compose bulunamadı."
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
                sh './run-selenium-tests.sh'
            }
        }
    }

    post {
        always {
            // Birim test raporları
            junit 'target/surefire-reports/*.xml'
            // Entegrasyon ve Selenium test raporları (failsafe)
            junit 'target/failsafe-reports/*.xml'
        }
    }
}
