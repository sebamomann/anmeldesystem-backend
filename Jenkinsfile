def image
def branch_name = "${env.BRANCH_NAME}"
def github_token = "${env.GITHUB_STATUS_ACCESS_TOKEN}"
def build_number = "${env.BUILD_NUMBER}"

def tagName = 'jb_' + branch_name + "_" + build_number
def dbName = 'newman_db_' + tagName
def newmanName = 'newman_' + tagName
def netName = 'newman_net_' + tagName
def apiName = 'newman_backend'

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
                    image = docker.build("anmeldesystem/anmeldesystem-backend:" + tagName)
                }
            }
        }

        stage('Newman prepare') {
            steps {
                script {
                    try {
                        sh 'docker network create ' + netName
                    } catch (err) {
                        echo err.getMessage()
                    }

                    sh 'docker run -d ' +
                            '--name ' + dbName + ' ' +
                            '--env MYSQL_ROOT_PASSWORD=password ' +
                            '--env MYSQL_DATABASE=anmeldesystem-api-newman ' +
                            '--env MYSQL_USER=user ' +
                            '--env MYSQL_PASSWORD=password ' +
                            '--network ' + netName + ' ' +
                            '--health-cmd=\'mysqladmin ping --silent\' ' +
                            'mysql ' +
                            'mysqld --default-authentication-plugin=mysql_native_password'

                    waitUntil {
                        "healthy" == sh(returnStdout: true,
                                script: "docker inspect " + dbName + " --format=\"{{ .State.Health.Status }}\"").trim()
                    }

                    sh 'docker run -d ' +
                            '--name ' + apiName + ' ' +
                            '--env DB_USERNAME=root ' +
                            '--env DB_PASSWORD=password ' +
                            '--env DB_HOST=' + dbName + ' ' +
                            '--env DB_PORT=3306 ' +
                            '--env DB_DATABASE=anmeldesystem-api-newman ' +
                            '--env SALT_JWT=salt ' +
                            '--env SALT_MAIL=salt ' +
                            '--env SALT_ENROLLMENT=salt ' +
                            '--env DOMAIN=go-join.me ' +
                            '--env NODE_ENV=postman ' +
                            '--network ' + netName + ' ' +
                            '--health-cmd=\'curl localhost:3000/healthcheck || exit 1 \' ' +
                            '--health-interval=2s ' +
                            'anmeldesystem/anmeldesystem-backend:' + tagName

                    waitUntil {
                        "healthy" == sh(returnStdout: true,
                                script: "docker inspect " + apiName + " --format=\"{{ .State.Health.Status }}\"").trim()
                    }
                }
            }
        }
        stage('Newman exec') {
            steps {
                script {
//                    def text = readFile file: "./gjm-test.postman_collection.json"
//                    text = text.replaceAll("localhost", "anmeldesystem-backend-newman_build_" + build_number)
//                    writeFile file: "./gjm-test.postman_collection.json", text: text
//                    sh 'ls -la $(pwd)'
//                    sh 'chmod 777 gjm-test.postman_collection.json'
//                    sh 'ls -la $(pwd)'
                    sh 'docker run ' +
                            '-v $(pwd)/gjm-test.postman_collection.json:/etc/newman/collection.json ' +
                            '--name ' + newmanName + ' ' +
                            '--net ' + netName + ' ' +
                            '-t postman/newman:alpine ' +
                            'run "https://raw.githubusercontent.com/sebamomann/anmeldesystem-backend/' + branch_name + '/gjm-test.postman_collection.json" --delay-request 100 -n 1 --bail --delay-request 100'
                }
            }
        }
        stage('Publish to registry') {
            when {
                expression {
                    return branch_name =~ /^\d\.\d\.\d(-\d+)?/
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
                    sh 'docker image prune --filter label=stage_intermediate -f'
                } catch (err) {
                    echo err.getMessage()
                }

                try {
                    sh 'docker container rm ' + apiName + ' -f'
                } catch (err) {
                    echo err.getMessage()
                }

                try {
                    sh 'docker container rm ' + newmanName + ' -f'
                } catch (err) {
                    echo err.getMessage()
                }

                try {
                    sh 'docker container rm ' + dbName + ' -f'
                } catch (err) {
                    echo err.getMessage()
                }

                try {
                    sh 'docker network rm ' + netName
                } catch (err) {
                    echo err.getMessage()
                }

                try {
                    sh 'docker image rm anmeldesystem/anmeldesystem-backend:' + tagName + ' -f'
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

