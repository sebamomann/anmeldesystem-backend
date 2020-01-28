pipeline {
  agent {
    node {
      label 'node'
    }

  }
  stages {
    stage('test') {
      steps {
        sh 'npm test'
      }
    }
    stage('build') {
      steps {
        sh 'npm --version'
        sh 'npm run-script build --prod'
      }
    }
  }
}