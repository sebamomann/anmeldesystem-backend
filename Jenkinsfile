pipeline {
  agent any

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }
    //stage('Test App') {
      // steps {
        // sh 'npm test'
      // }
    //}
    stage('Build Docker image') {
      steps {  
        script {
          def image = docker.build("anmeldesystem-backend:${env.BUILD_ID}")
        }
      }
    }
    stage('Deploy to HUB') {
      steps {
        script {
          image.push()
          image.push(':latest')
        }
      }
    }
    stage('Execute') {
      steps {
        sh 'docker-compose -f compose.yml up -d'
      }
    }
  }
}