img = null

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
          image = docker.build("sebamomann/anmeldesystem-backend:${env.BUILD_ID}")
        }
      }
    }
    stage('Deploy to HUB') {
      steps {
        withDockerRegistry([credentialsId: "docker-hub-sebamomann", url: ""]) {
          script {
            image.push("${env.BUILD_ID}")
            image.push("latest")
          }
        }
      }
    }
    stage('Prepare execute (env)') {
      sh 'touch .env'
    }
    stage('Execute') {
      steps {
        sh 'docker-compose -f compose.yml up -d'
      }
    }
  }
}