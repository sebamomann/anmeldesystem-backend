pipeline {
  agent any

  stages {
    stage('Checkout') {
      checkout scm
    }
    stage('Test App') {
      steps {
        sh 'npm test'
      }
    }
    stage('Build Docker image') {
      steps {  
        script {
          def image = docker.build("anmeldesystem-backend:${env.BUILD_ID}")
        }
      }
    }
    stage('Deploy to HUB') {
      image.push()
      image.push(':latest')
    }
    stage('Execute') {
      sh 'docker-compose -f compose.yml up -d'
    }
  }
}