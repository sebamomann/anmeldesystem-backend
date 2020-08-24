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

                    sh 'docker run -d ' +
                            '-p 34299:3306 ' + // 0.0.0.0
                            '--name newman_db ' +
                            '--env MYSQL_ROOT_PASSWORD=password ' +
                            '--env MYSQL_DATABASE=anmeldesystem-api ' +
                            '--env MYSQL_USER=user ' +
                            '--env MYSQL_PASSWORD=password ' +
                            '--network newmanNet ' +
                            '--health-cmd=\'mysqladmin ping --silent\' ' +
                            'mysql mysqld --default-authentication-plugin=mysql_native_password'

                    retry(10) {
                        sleep 2
                        HEALTH = sh(
                                script: 'docker inspect --format=\'{{json .State.Health.Status}}\' newman_db',
                                returnStdout: true
                        ).trim()
                        echo "${HEALTH}"

                        if (HEALTH == "running") {
                            return true
                        }
                    }

                    sh 'docker run -d ' +
                            '-p 34298:3000 ' +
                            '--name anmeldesystem-backend-newman ' +
                            '--env DB_USERNAME=root ' +
                            '--env DB_PASSWORD=password ' +
                            '--env DB_HOST=newman_db ' +
                            '--env DB_PORT=3306 ' +
                            '--env DB_DATABASE=anmeldesystem-api ' +
                            '--env SALT_JWT=salt ' +
                            '--env SALT_MAIL=salt ' +
                            '--env SALT_ENROLLMENT=salt ' +
                            '--env DOMAIN=go-join.me ' +
                            '--env NODE_ENV=test_postman ' +
                            '--network newmanNet ' +
                            '--health-cmd=\'wget localhost:3000/healthcheck || exit 1 \' ' +
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
                            '--network newmanNet ' +
                            '-t postman/newman:alpine ' +
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
//
//                try {
//                    sh 'docker container rm newman_db -f'
//                } catch (err) {
//                    echo err.getMessage()
//                }
//
//                try {
//                    sh 'docker network rm newmanNet -f'
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

