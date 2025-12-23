pipeline {
    agent any

    tools {
        jdk 'JDK17'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build & Unit Tests') {
            steps {
                sh './mvnw clean test -DskipSelenium=true'
            }
        }

        stage('Selenium Tests') {
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
            junit 'target/surefire-reports/*.xml'
        }
    }
}
