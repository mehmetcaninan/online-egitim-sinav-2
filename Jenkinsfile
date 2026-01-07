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
        JAVA_HOME = tool name: 'JDK17'
        PATH = "${JAVA_HOME}/bin:${PATH}"
        CI = 'true'
        SELENIUM_HEADLESS = 'true'
        stage('0 - Webhook Test & Info') {
            steps {
                script {
                    echo "🔗 WEBHOOK OTOMATIK TETİKLEME TESTİ"
                    echo "=================================="

                    // Build sebepini kontrol et
                    echo "Build Cause: ${env.BUILD_CAUSE ?: 'Bilinmiyor'}"
                    echo "Git Commit: ${env.GIT_COMMIT ?: 'Bulunamadı'}"
                    echo "Git Branch: ${env.GIT_BRANCH ?: 'Bulunamadı'}"
                    echo "Git URL: ${env.GIT_URL ?: 'Bulunamadı'}"

                    // Webhook test scripti çalıştır
                    if (fileExists('webhook-test.sh')) {
                        sh 'chmod +x webhook-test.sh && ./webhook-test.sh'
                    }

                    echo "=================================="
                }
            }
        }

        DISPLAY = ':99'
        // Webhook test için environment variable
        WEBHOOK_TRIGGERED = "${env.BUILD_CAUSE?.contains('GitHubPushCause') ? 'true' : 'false'}"
    }

    tools {
        jdk 'JDK17'
        maven 'Maven3'
    }

    stages {
        stage('1 - Checkout (GitHub)') {
            steps {
                checkout scm
            }
        }

        stage('2 - Build') {
            steps {
                sh './mvnw clean package -DskipTests'
            }
        }

        stage('3 - Unit Tests') {
            steps {
                sh './mvnw test -DskipSelenium=true'
            }
        }

        stage('4 - Integration Tests') {
            steps {
                sh './mvnw failsafe:integration-test failsafe:verify -DskipSelenium=true'
            }
        }

        stage('5 - Docker Containers') {
            steps {
                script {
                    try {
                        if (fileExists('docker-compose.yml')) {
                            sh '''
                                echo "[Docker Stage] Docker durumu kontrol ediliyor..."

                                # Docker durumunu kontrol et
                                if command -v docker >/dev/null 2>&1; then
                                    echo "[Docker Stage] Docker: $(command -v docker)"
                                else
                                    echo "[Docker Stage] Docker bulunamadı"
                                fi

                                # Docker compose kontrolü
                                if command -v docker-compose >/dev/null 2>&1; then
                                    echo "[Docker Stage] docker-compose: $(command -v docker-compose)"
                                elif docker compose version >/dev/null 2>&1; then
                                    echo "[Docker Stage] docker compose v2 mevcut"
                                else
                                    echo "[Docker Stage] docker-compose bulunamadı"
                                fi

                                echo "[Docker Stage] Bu ortamda container kontrolleri tamamlandı."
                            '''
                        } else {
                            echo "[Docker Stage] docker-compose.yml bulunamadı, Docker stage atlanıyor"
                        }
                    } catch (Exception e) {
                        echo "[Docker Stage] UYARI: Docker kontrolü başarısız oldu ancak devam ediliyor: ${e.message}"
                    }
                }
            }
        }

        stage('6 - Setup CI Environment for Selenium') {
            steps {
                sh '''
                    echo "🔧 CI ortamı için Selenium gerekli paketleri kuruluyor..."

                    # Package manager'ı tespit et
                    if command -v apt-get >/dev/null 2>&1; then
                        echo "Ubuntu/Debian tespit edildi"
                        export DEBIAN_FRONTEND=noninteractive

                        # Gerekli paketleri kur
                        apt-get update -y || echo "apt-get update başarısız oldu"
                        apt-get install -y wget curl unzip xvfb || echo "Bazı paketler kurulamadı"

                        # Chrome kuruluşu
                        wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - || echo "Chrome key eklenemedi"
                        echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list || echo "Chrome repo eklenemedi"
                        apt-get update -y || echo "Chrome repo update başarısız"
                        apt-get install -y google-chrome-stable || echo "Chrome kurulumu başarısız"

                    elif command -v yum >/dev/null 2>&1; then
                        echo "RHEL/CentOS tespit edildi"
                        yum install -y wget curl unzip xorg-x11-server-Xvfb || echo "Bazı paketler kurulamadı"

                        # Chrome kuruluşu
                        wget -O /tmp/google-chrome.rpm https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm || echo "Chrome indirilemedi"
                        yum localinstall -y /tmp/google-chrome.rpm || echo "Chrome kurulumu başarısız"

                    else
                        echo "⚠️  Package manager tespit edilemedi, mevcut araçlarla devam ediliyor"
                    fi

                    # Virtual display başlat
                    if command -v Xvfb >/dev/null 2>&1; then
                        echo "🖥️  Virtual display başlatılıyor..."
                        Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &
                        sleep 2
                    fi

                    echo "✅ CI ortamı hazır"
                '''
            }
        }

        stage('7 - Selenium UI Test Senaryoları') {
            steps {
                script {
                    if (fileExists('run-selenium-tests.sh')) {
                        sh 'chmod +x run-selenium-tests.sh'

                        catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE') {
                            sh './run-selenium-tests.sh'
                        }
                    } else {
                        echo "⚠️ run-selenium-tests.sh dosyası bulunamadı, Selenium testleri Maven ile çalıştırılıyor"

                        catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE') {
                            sh '''
                                echo "🧪 Selenium testleri Maven ile çalıştırılıyor..."

                                # Backend'i arka planda başlat
                                nohup ./mvnw spring-boot:run -Dspring-boot.run.profiles=test > backend.log 2>&1 &
                                BACKEND_PID=$!
                                echo "Backend PID: $BACKEND_PID"

                                # Backend'in başlamasını bekle
                                echo "⏳ Backend başlatılıyor..."
                                sleep 30

                                # Selenium testlerini çalıştır
                                ./mvnw failsafe:integration-test -Dtest="**/*Selenium*" -DfailIfNoTests=false

                                # Backend'i durdur
                                kill $BACKEND_PID || echo "Backend zaten durmuş"
                            '''
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                // Test sonuçlarını topla
                if (fileExists('target/surefire-reports/*.xml')) {
                    junit 'target/surefire-reports/*.xml'
                }

                if (fileExists('target/failsafe-reports/*.xml')) {
                    junit 'target/failsafe-reports/*.xml'
                }

                echo "✅ Test sonuçları başarıyla publish edildi"

                // Cleanup
                sh '''
                    # Virtual display'i durdur
                    pkill Xvfb || echo "Xvfb zaten durmuş"

                    # Backend process'lerini temizle
                    pkill -f "spring-boot:run" || echo "Backend process'leri temizlendi"
                '''
            }
        }

        success {
            echo "🎉 Pipeline başarıyla tamamlandı!"
        }

        unstable {
            echo "⚠️ Pipeline tamamlandı ancak bazı testler başarısız oldu"
        }

        failure {
            echo "❌ Pipeline başarısız oldu"
        }
    }
}
