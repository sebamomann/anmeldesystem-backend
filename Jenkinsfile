def image

pipeline {
  agent any

  stages {
    stage('Build Docker image') {
      steps {
        script {
          image = docker.build("anmeldesystem/anmeldesystem-backend")
        }
      }
    }
    stage('Publish to registry') {
      steps {
        script {
          docker.withRegistry('http://localhost:34015') {
            if (LATEST == 'true') {
              image.push("latest")
            }

            image.push("${VERSION}")
          }
        }
      }
    }
  }
}
