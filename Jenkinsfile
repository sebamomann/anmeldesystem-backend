def image
def branch_name = "${env.BRANCH_NAME}"
def github_token = "${env.GITHUB_STATUS_ACCESS_TOKEN}"
def build_number = "${env.BUILD_NUMBER}"

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
                    image = docker.build("anmeldesystem/anmeldesystem-backend:build_" + build_number)
                }
            }
        }
        stage('Newman prepare') {
            steps {
                script {
                    try {
                        sh 'docker network create newmanNet_build_' + build_number
                    } catch (err) {
                        echo err.getMessage()
                    }

                    sh 'docker run -d ' +
                            '-p 34299:3306 ' + // 0.0.0.0
                            '--name newman_db_build_' + build_number + ' ' +
                            '--env MYSQL_ROOT_PASSWORD=password ' +
                            '--env MYSQL_DATABASE=anmeldesystem-api ' +
                            '--env MYSQL_USER=user ' +
                            '--env MYSQL_PASSWORD=password ' +
                            '--network newmanNet_build_' + build_number + ' ' +
                            '--health-cmd=\'mysqladmin ping --silent\' ' +
                            'mysql ' +
                            'mysqld --default-authentication-plugin=mysql_native_password'

                    waitUntil {
                        "healthy" == sh(returnStdout: true,
                                script: "docker inspect newman_db_build_" + build_number + " --format=\"{{ .State.Health.Status }}\"").trim()
                    }

                    sh 'docker run -d ' +
                            '-p 34298:3000 ' +
                            '--name anmeldesystem-backend-newman_build_' + build_number + ' ' +
                            '--env DB_USERNAME=root ' +
                            '--env DB_PASSWORD=password ' +
                            '--env DB_HOST=newman_db_build_' + build_number + ' ' +
                            '--env DB_PORT=3306 ' +
                            '--env DB_DATABASE=anmeldesystem-api ' +
                            '--env SALT_JWT=salt ' +
                            '--env SALT_MAIL=salt ' +
                            '--env SALT_ENROLLMENT=salt ' +
                            '--env DOMAIN=go-join.me ' +
                            '--env NODE_ENV=test_postman ' +
                            '--network newmanNet_build_' + build_number + ' ' +
                            '--health-cmd=\'curl localhost:3000/healthcheck || exit 1 \' ' +
                            '--health-interval=2s ' +
                            'anmeldesystem/anmeldesystem-backend:build_' + build_number

                    waitUntil {
                        "healthy" == sh(returnStdout: true,
                                script: "docker inspect anmeldesystem-backend-newman_build_" + build_number + " --format=\"{{ .State.Health.Status }}\"").trim()
                    }
                }
            }
        }
        stage('Newman exec') {
            steps {
                script {
                    def text = readFile file: "${pwd}/collection/collection.json"
                    text = text.replaceAll("localhost", "anmeldesystem-backend-newman_build_" + build_number)
                    writeFile file: "${pwd}/collection/collection.json", text: text

                    sh 'docker run ' +
                            '-v ${pwd}/collection:/etc/newman ' +
                            '--name newman_build_' + build_number + ' ' +
                            '--network newmanNet_build_' + build_number + ' ' +
                            '-t postman/newman:alpine ' +
                            'run "collection.json" --delay-request 100 -n 1 --bail --delay-request 100'
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
                        image.push('latest')
                    }
                }
            }
        }
        stage('Publish to registry - master') {
            when {
                expression {
                    return branch_name =~ "master"
                }
            }
            steps {
                script {
                    docker.withRegistry('http://localhost:34015') {
                        image.push('latest')
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                try {
                    sh 'docker container rm anmeldesystem-backend-newman_build_' + build_number + ' -f'
                } catch (err) {
                    echo err.getMessage()
                }

                try {
                    sh 'docker container rm newman_build_' + build_number + ' -f'
                } catch (err) {
                    echo err.getMessage()
                }

                try {
                    sh 'docker container rm newman_db_build_' + build_number + ' -f'
                } catch (err) {
                    echo err.getMessage()
                }

                try {
                    sh 'docker network rm newmanNet_build_' + build_number + ' -f'
                } catch (err) {
                    echo err.getMessage()
                }
            }
        }
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

