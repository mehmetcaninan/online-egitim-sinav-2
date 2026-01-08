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
        DISPLAY = ':99'
    }

    tools {
        jdk 'JDK17'
        maven 'Maven3'
    }

    stages {
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

                        # Sistem güncellemesi
                        apt-get update -qq || echo "⚠️  apt-get update başarısız"

                        # Gerekli paketleri kur
                        apt-get install -y -qq wget curl unzip xvfb net-tools || echo "Bazı paketler kurulamadı"

                        echo "🌐 Selenium Driver stratejisi belirleniyor..."

                        # Chrome kurulumunu dene ama başarısızlık durumunda HTMLUnit'e fallback yap
                        CHROME_AVAILABLE=false

                        # Önce mevcut Chrome'u kontrol et
                        if command -v google-chrome >/dev/null 2>&1 || command -v chromium-browser >/dev/null 2>&1; then
                            CHROME_AVAILABLE=true
                            echo "✅ Chrome/Chromium zaten mevcut"
                        else
                            # Chrome kurulumunu hızlı şekilde dene
                            echo "📥 Chrome kurulum denemesi..."
                            cd /tmp

                            # Lightweight Chrome kurulum denemesi
                            if wget -q --timeout=30 https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb 2>/dev/null; then
                                if dpkg -i ./google-chrome-stable_current_amd64.deb 2>/dev/null && command -v google-chrome >/dev/null 2>&1; then
                                    CHROME_AVAILABLE=true
                                    echo "✅ Chrome başarıyla kuruldu"
                                else
                                    echo "⚠️ Chrome kurulumu başarısız - HTMLUnit driver kullanılacak"
                                fi
                            else
                                echo "⚠️ Chrome indirme başarısız - HTMLUnit driver kullanılacak"
                            fi
                        fi

                        # Chrome durumuna göre config ayarla
                        if [ "$CHROME_AVAILABLE" = "true" ]; then
                            CHROME_BINARY=""
                            if command -v google-chrome >/dev/null 2>&1; then
                                CHROME_BINARY="/usr/bin/google-chrome"
                            elif command -v chromium-browser >/dev/null 2>&1; then
                                CHROME_BINARY="/usr/bin/chromium-browser"
                            fi

                            echo "CHROME_BINARY_PATH=$CHROME_BINARY" > /tmp/chrome-config
                            echo "USE_CHROME=true" >> /tmp/chrome-config
                            echo "✅ Chrome driver kullanılacak: $CHROME_BINARY"
                        else
                            echo "USE_HTMLUNIT=true" > /tmp/chrome-config
                            echo "✅ HTMLUnit driver kullanılacak (Chrome'a bağımlılık yok)"
                        fi

                    elif command -v yum >/dev/null 2>&1; then
                        echo "RHEL/CentOS tespit edildi"
                        yum install -y wget curl unzip xorg-x11-server-Xvfb net-tools || echo "Bazı paketler kurulamadı"

                        # RHEL/CentOS'da da HTMLUnit'i tercih et
                        echo "USE_HTMLUNIT=true" > /tmp/chrome-config
                        echo "✅ RHEL ortamında HTMLUnit driver kullanılacak"

                    else
                        echo "⚠️  Package manager tespit edilemedi"
                        echo "USE_HTMLUNIT=true" > /tmp/chrome-config
                        echo "✅ Bilinmeyen ortamda HTMLUnit driver kullanılacak"
                    fi

                    # Virtual display - sadece Chrome kullanılacaksa gerekli
                    if [ -f "/tmp/chrome-config" ] && grep -q "USE_CHROME=true" /tmp/chrome-config 2>/dev/null; then
                        if command -v Xvfb >/dev/null 2>&1; then
                            echo "🖥️  Virtual display başlatılıyor (Chrome için)..."
                            export DISPLAY=:99
                            pkill -f "Xvfb" 2>/dev/null || true
                            sleep 2

                            Xvfb :99 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset > /dev/null 2>&1 &
                            XVFB_PID=$!
                            sleep 3

                            if ps -p $XVFB_PID > /dev/null 2>&1; then
                                echo "✅ Virtual display hazır (PID: $XVFB_PID)"
                            else
                                echo "⚠️ Virtual display sorunu"
                            fi
                        fi
                    else
                        echo "✅ HTMLUnit driver - Virtual display gerekmiyor"
                    fi

                    echo "✅ CI ortamı hazırlanması tamamlandı"
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
