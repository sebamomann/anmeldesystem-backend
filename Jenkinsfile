img = null

pipeline {
  agent any

  stages {
    //stage('Test App') {
      // steps {
        // sh 'npm test'
      // }
    //}
    stage('Build Docker image') {
      steps {  
        script {
          image = docker.build("sebamomann/anmeldesystem-backend:${VERSION}", "--build-arg version=${VERSION} .")
        }
      }
    }
    stage('Deploy to HUB version') {
      steps {
        withDockerRegistry([credentialsId: "docker-hub-sebamomann", url: ""]) {
          script {
            echo LATEST
            image.push("${VERSION}")
          }
        }
      }
    }
    stage('Deploy to HUB latest') {
      when {
        expression {
          return LATEST == "true"
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
          return LATEST == "true"
        }
      }
      steps {
        echo 'preparing .env file'

        script {
          def data = """
            SALT_JWT=${SALT_JWT}
            SALT_MAIL=${SALT_MAIL}
            SALT_ENROLLMENT=${SALT_ENROLLMENT}
            MAIL_ECA=${MAIL_ECA}
            MAIL_ECA_PASSWORD=${MAIL_ECA_PASSWORD}
            DOMAIN=${DOMAIN}
            DB_HOST=${DB_HOST}
            DB_PORT=${DB_PORT}
            DB_USERNAME=${DB_USERNAME}
            DB_PASSWORD=${DB_PASSWORD}
            DB_DATABASE=${DB_DATABASE}
          """
        }

        writeFile(file: ".env", text: data)

        echo 'execute ...'
        sh 'docker-compose -f compose.yml up -d'
      }
    }
  }
}