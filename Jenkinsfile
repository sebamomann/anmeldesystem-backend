def image

pipeline {
  agent any

  parameters {
    string(name: 'VERSION', defaultValue: '0.0.0')
    boolean(name: 'LATEST', defaultValue: 'true')
  }

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
