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
          image = docker.build("sebamomann/anmeldesystem-backend:${env.BUILD_ID}", "--build-arg version=${VERSION} .")
        }
      }
    }
    stage('Deploy to HUB version') {
      steps {
        withDockerRegistry([credentialsId: "docker-hub-sebamomann", url: ""]) {
          script {
            image.push("${env.BUILD_ID}")
          }
        }
      }
    }
    stage('Deploy to HUB latest') {
      when {
        expression {
          return true == true
        }
      }
      steps {
        withDockerRegistry([credentialsId: "docker-hub-sebamomann", url: ""]) {
          script {
            image.push("latest")
          }
        }
      }
    }
    stage('Execute') {
      when {
        expression {
          return true == true
        }
      }
      steps {
        echo 'preparing .env file'
        sh 'touch .env'

        echo 'execute ...'
        sh 'docker-compose -f compose.yml up -d'
      }
    }
  }
}