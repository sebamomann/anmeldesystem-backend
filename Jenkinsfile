pipeline {
    agent { docker { image 'node:6.3' } }
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
