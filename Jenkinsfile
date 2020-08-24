def image
def branch_name = "${env.BRANCH_NAME}"
def github_token = "${env.GITHUB_STATUS_ACCESS_TOKEN}"

pipeline {
    agent any

    environment {
        GITHUB_STATUS_ACCESS_TOKEN_SEBAMOMANN = credentials('GITHUB_STATUS_ACCESS_TOKEN_SEBAMOMANN')
    }

    options {
        ansiColor('xterm')
    }

    stages {
        stage('Preamble') {
            steps {
                script {
                    updateStatus("pending")
                }
            }
        }

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
//
//                    sh 'docker run ' +
//                            '-p 34299:3306 ' + // 0.0.0.0
//                            '--name newman_db ' +
//                            '--env MYSQL_ROOT_PASSWORD=password ' +
//                            '--env MYSQL_DATABASE=anmeldesystem-api ' +
//                            '--env MYSQL_USER=user ' +
//                            '--env MYSQL_PASSWORD=password ' +
//                            '--health-cmd=\'stat /etc/passwd || exit 1 \' ' +
//                            '--health-interval=2s ' +
//                            '-d ' +
//                            'mysql '
//
//                    retry(10) {
//                        sleep 2
//                        HEALTH = sh(
//                                script: 'docker inspect --format=\'{{json .State.Health.Status}}\' newman_db',
//                                returnStdout: true
//                        ).trim()
//                        echo "${HEALTH}"
//
//                        if (HEALTH == "running") {
//                            return true
//                        }
//                    }

                    sh 'docker run -d ' +
                            '--name anmeldesystem-backend-newman ' +
                            '-p 34298:8080 ' +
                            '--env DB_USERNAME=anmeldesystem-api-testing ' +
                            '--env DB_PASSWORD="Oa(zGPsbFl&cowu3p&9~" ' +
                            '--env DB_HOST=cp.dankoe.de ' +
                            '--env DB_PORT=3306 ' +
                            '--env DB_DATABASE=anmeldesystem-api-testing ' +
                            '--env SALT_JWT=salt ' +
                            '--env SALT_MAIL=salt ' +
                            '--env SALT_ENROLLMENT=salt ' +
                            '--env DOMAIN=go-join.me ' +
                            '--net newmanNet'
                            '--health-cmd=\'stat /etc/passwd || exit 1 \' ' +
                            '--health-interval=2s ' +
                            'anmeldesystem/anmeldesystem-backend:latest'

                    retry(10) {
                        sleep 2
                        HEALTH = sh(
                                script: 'docker inspect --format=\'{{json .State.Health.Status}}\' anmeldesystem-backend-newman',
                                returnStdout: true
                        ).trim()
                        echo "${HEALTH}"

                        if (HEALTH == "running") {
                            return true
                        }
                    }
                }
            }
        }
        stage('Newman exec') {
            steps {
                script {
                    sh 'docker run ' +
                            '-v $(pwd)/collection.json:/etc/newman/collection.json ' +
                            '--name newman ' +
                            '-t postman/newman:alpine ' +
                            '--net newmanNet'
                            'run "https://raw.githubusercontent.com/sebamomann/anmeldesystem-backend/test/collection.json"'
                }
            }
        }
        stage('Publish to registry') {
            when {
                expression {
                    return branch_name =~ /^\d\.\d\.\d/
                }
            }
            steps {
                script {
                    docker.withRegistry('http://localhost:34015') {
                        image.push(branch_name)
                    }
                }
            }
        }
    }

    post {
//        always {
//            script {
//                try {
//                    sh 'docker container rm anmeldesystem-backend-newman -f'
//                } catch (err) {
//                    echo err.getMessage()
//                }
//
//                try {
//                    sh 'docker container rm newman -f'
//                } catch (err) {
//                    echo err.getMessage()
//                }
//            }
//        }
        success {
            script {
                updateStatus("success")
            }
        }
        failure {
            script {
                updateStatus("failure")
            }
        }
        aborted {
            script {
                updateStatus("error")
            }
        }
    }
}

void updateStatus(String value) {
    sh 'curl -s "https://api.github.com/repos/sebamomann/anmeldesystem-backend/statuses/$GIT_COMMIT" \\\n' +
            '  -H "Content-Type: application/json" \\\n' +
            '  -H "Authorization: token $GITHUB_STATUS_ACCESS_TOKEN_SEBAMOMANN" \\\n' +
            '  -X POST \\\n' +
            '  -d "{\\"state\\": \\"' + value + '\\", \\"description\\": \\"Jenkins\\", \\"context\\": \\"continuous-integration/jenkins\\", \\"target_url\\": \\"https://jenkins.dankoe.de/job/anmeldesystem-backend/job/$BRANCH_NAME/$BUILD_NUMBER/console\\"}" \\\n' +
            '  '
}

