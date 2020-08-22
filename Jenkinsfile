def image

properties([
        parameters([
                string(name: 'VERSION', defaultValue: '0.0.0'),
                booleanParam(name: 'LATEST', defaultValue: 'true'),
        ])
])

pipeline {
    agent any

    options {
        ansiColor('xterm')
    }

    stages {
        stage('Build Docker image') {
            steps {
                script {
                    image = docker.build("anmeldesystem/anmeldesystem-backend")
                }
            }
        }
        stage('Newman prepare') {
            steps {
                script {
                    try {
                        sh 'docker network create newmanNet'
                    } catch (err) {
                        echo err.getMessage()
                    }

                    sh 'docker run -d ' +
                            '-p 34299:3306 ' +
                            '--env MYSQL_ROOT_PASSWORD=password ' +
                            '--env MYSQL_DATABASE=anmeldesystem-api ' +
                            '--name newmanDB ' +
                            '--net newmanNet ' +
                            'mysql'
                    sh 'docker run -d ' +
                            '--name anmeldesystem-backend-newman ' +
                            '-p 34289:8080 ' +
                            '--env DB_USERNAME=root ' +
                            '--env DB_PASSWORD=password ' +
                            '--env DB_HOST=newmanDB ' +
                            '--env DB_PORT=34299 ' +
                            '--env DB_NAME=anmeldesystem-api ' +
                            '--env SALT_JWT=salt ' +
                            '--env SALT_MAIL=salt ' +
                            '--env SALT_ENROLLMENT=salt ' +
                            '--env DOMAIN=go-join.me ' +
                            '--net newmanNet ' +
                            'anmeldesystem/anmeldesystem-backend:latest'
                }
            }
        }
        stage('Newman exec') {
            steps {
                script {
                    sh 'docker run ' +
                            '-v ./postman_collection.json:/etc/newman/collection.json ' +
                            '--name newman ' +
                            '--net newmanNet ' +
                            '-t postman/newman:alpine ' +
                            'run "collection.json"'
                }
            }
        }
//        stage('Publish to registry') {
//            steps {
//                script {
//                    docker.withRegistry('http://localhost:34015') {
//                        if (LATEST == 'true') {
//                            image.push("latest")
//                        }
//
//                        image.push("${VERSION}")
//                    }
//                }
//            }
//        }
    }
    post {
        always {
            script {
                try {
                    sh 'docker container rm anmeldesystem-backend-newman -f'
                } catch (err) {
                    echo err.getMessage()
                }

                try {
                    sh 'docker container rm newmanDB -f'
                } catch (err) {
                    echo err.getMessage()
                }

                try {
                    sh 'docker container rm stop newman -f'
                } catch (err) {
                    echo err.getMessage()
                }
            }
        }
    }
}
