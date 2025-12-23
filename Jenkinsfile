pipeline {
    agent any

    environment {
        MAVEN_OPTS = '-Dmaven.repo.local=.m2/repository'
        DOCKER_IMAGE = 'online-egitim-sinav'
        DOCKER_TAG = "${BUILD_NUMBER}"
        APP_PORT = '8081'
    }

    stages {

        stage('1. GitHub Kodlarını Çek') {
            steps {
                checkout scm
            }
        }

        stage('2. Build (Jar)') {
            steps {
                sh './mvnw clean package -DskipTests'
            }
            post {
                success {
                    archiveArtifacts artifacts: 'target/*.jar', fingerprint: true
                }
            }
        }

        stage('3. Birim Testleri') {
            steps {
                sh './mvnw test'
            }
            post {
                always {
                    junit 'target/surefire-reports/*.xml'
                }
            }
        }

        stage('4. Docker Image Oluştur') {
            steps {
                sh "./mvnw jib:dockerBuild -Dimage=${DOCKER_IMAGE}:${DOCKER_TAG}"
            }
        }

        stage('5. Container Çalıştır') {
            steps {
                sh '''
                    docker stop online-egitim-test || true
                    docker rm online-egitim-test || true

                    docker run -d --name online-egitim-test \
                      -p ${APP_PORT}:8081 \
                      -e SPRING_PROFILES_ACTIVE=test \
                      ${DOCKER_IMAGE}:${DOCKER_TAG}
                '''
            }
        }

        stage('6. (Opsiyonel) Selenium Testleri') {
            when {
                expression { fileExists('src/test/java') }
            }
            steps {
                sh "./mvnw test -Dtest=UserLoginSeleniumTest -DbaseUrl=http://localhost:${APP_PORT} || true"
            }
        }
    }

    post {
        always {
            sh '''
                docker stop online-egitim-test || true
                docker rm online-egitim-test || true
            '''
        }
    }
}
