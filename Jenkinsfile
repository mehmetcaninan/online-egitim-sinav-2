pipeline {
    agent any

    triggers {
        githubPush()
    }

    options {
        timeout(time: 15, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
        skipDefaultCheckout(false)
        timestamps()
    }

    environment {
        COMPOSE_PROJECT_NAME = "local-jenkins-${BUILD_NUMBER}"
        DOCKER_BUILDKIT = '1'
        CI = 'true'
        SELENIUM_HEADLESS = 'true'
        CHROME_BIN = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        CHROMEDRIVER_PATH = '/usr/local/bin/chromedriver'
    }

    stages {

        /* =====================================================
           🔥 SADECE BİR KERE ÇALIŞACAK WORKSPACE TEMİZLİĞİ
           ===================================================== */
        stage('🧹 Workspace Clean (ONE TIME)') {
            steps {
                cleanWs()
            }
        }

        stage('🚀 Checkout & Info') {
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

        stage('🔧 Environment Setup') {
            steps {
                script {
                    sh '''
                        export PATH="/usr/local/bin:/opt/homebrew/bin:/Applications/Docker.app/Contents/Resources/bin:$PATH"

                        if ! pgrep -f "Docker Desktop" >/dev/null 2>&1; then
                            open -a "Docker Desktop" || true
                            sleep 15
                        fi

                        DOCKER_PATH=""
                        for path in "/usr/local/bin/docker" "/opt/homebrew/bin/docker" "/Applications/Docker.app/Contents/Resources/bin/docker"; do
                            [ -f "$path" ] && DOCKER_PATH="$path" && break
                        done

                        [ -z "$DOCKER_PATH" ] && exit 1

                        mkdir -p ~/.docker
                        cat > ~/.docker/config.json << 'EOF'
{
  "auths": {},
  "credsStore": "",
  "credHelpers": {}
}
EOF

                        echo "DOCKER_PATH=$DOCKER_PATH" > docker_env.txt
                    '''

                    if (!fileExists('docker-compose.yml')) {
                        error "docker-compose.yml dosyası bulunamadı!"
                    }
                }
            }
        }

        stage('🏗️ Build & Deploy') {
            steps {
                script {
                    sh '''
                        . ./docker_env.txt
                        "$DOCKER_PATH" compose -p ${COMPOSE_PROJECT_NAME} build app frontend
                        "$DOCKER_PATH" compose -p ${COMPOSE_PROJECT_NAME} up -d app frontend
                        sleep 15
                    '''
                }
            }
        }

        stage('🧪 Run Tests') {
            steps {
                script {
                    sh '''
                        . ./docker_env.txt

                        APP_CONTAINER=$("$DOCKER_PATH" compose -p ${COMPOSE_PROJECT_NAME} ps -q app)

                        "$DOCKER_PATH" exec "$APP_CONTAINER" ./mvnw test -DskipSelenium=true -Dmaven.test.failure.ignore=false
                        "$DOCKER_PATH" exec "$APP_CONTAINER" ./mvnw failsafe:integration-test failsafe:verify -DskipSelenium=true -Dmaven.test.failure.ignore=false
                    '''
                }
            }
        }

        stage('📊 Test Results') {
            steps {
                script {
                    sh '''
                        . ./docker_env.txt
                        APP_CONTAINER=$("$DOCKER_PATH" compose -p ${COMPOSE_PROJECT_NAME} ps -q app)
                        "$DOCKER_PATH" cp "$APP_CONTAINER:/app/target/surefire-reports" ./surefire-reports || true
                        "$DOCKER_PATH" cp "$APP_CONTAINER:/app/target/failsafe-reports" ./failsafe-reports || true
                    '''
                }
            }
        }
    }

    post {
        always {
            script {
                junit 'surefire-reports/*.xml'
                junit 'failsafe-reports/*.xml'

                sh '''
                    . ./docker_env.txt
                    "$DOCKER_PATH" compose -p ${COMPOSE_PROJECT_NAME} down --volumes --remove-orphans || true
                '''
            }
        }

        success {
            echo "🎉 PIPELINE BAŞARILI"
        }

        failure {
            echo "❌ PIPELINE BAŞARISIZ"
        }
    }
}
