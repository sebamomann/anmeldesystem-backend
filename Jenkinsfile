def image
def branch_name = "${env.BRANCH_NAME}"
def github_token = "${env.GITHUB_STATUS_ACCESS_TOKEN}"

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
        stage('Preamble') {
            steps {
                script {
                    sh 'set +x -s curl "https://api.github.com/repos/sebamomann/anmeldesystem-backend/statuses/$GIT_COMMIT?access_token=$GITHUB_STATUS_ACCESS_TOKEN" \\\n' +
                            '  -H "Content-Type: application/json" \\\n' +
                            '  -X POST \\\n' +
                            '  -d "{\\"state\\": \\"pending\\", \\"description\\": \\"Jenkins\\", \\"context\\": \\"continuous-integration/jenkins\\", \\"target_url\\": \\"https://jenkins.dankoe.de/job/anmeldesystem-backend-test/$BUILD_NUMBER/console\\"}" \\\n' +
                            '  /dev/null'
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
//        stage('Newman prepare') {
//            steps {
//                script {
//                    try {
//                        sh 'docker network create newmanNet'
//                    } catch (err) {
//                        echo err.getMessage()
//                    }
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
//
//                    sh 'docker run -d ' +
//                            '--name anmeldesystem-backend-newman ' +
//                            '-p 34298:8080 ' +
//                            '--env DB_USERNAME=user ' +
//                            '--env DB_PASSWORD=password ' +
//                            '--env DB_HOST=newman_db ' +
//                            '--env DB_PORT=34299 ' +
//                            '--env DB_NAME=anmeldesystem-api ' +
//                            '--env SALT_JWT=salt ' +
//                            '--env SALT_MAIL=salt ' +
//                            '--env SALT_ENROLLMENT=salt ' +
//                            '--env DOMAIN=go-join.me ' +
//                            '--health-cmd=\'stat /etc/passwd || exit 1 \' ' +
//                            '--health-interval=2s ' +
//                            'anmeldesystem/anmeldesystem-backend:latest'
//
//                    retry(10) {
//                        sleep 2
//                        HEALTH = sh(
//                                script: 'docker inspect --format=\'{{json .State.Health.Status}}\' anmeldesystem-backend-newman',
//                                returnStdout: true
//                        ).trim()
//                        echo "${HEALTH}"
//
//                        if (HEALTH == "running") {
//                            return true
//                        }
//                    }
//                }
//            }
//        }
//        stage('Newman exec') {
//            steps {
//                script {
//                    sh 'docker run ' +
//                            '-v $(pwd)/collection.json:/etc/newman/collection.json ' +
//                            '--name newman ' +
//                            '--net newmanNet ' +
//                            '-t postman/newman:alpine ' +
//                            'run "https://raw.githubusercontent.com/sebamomann/anmeldesystem-backend/test/collection.json"'
//                }
//            }
//        }
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
        success {
            script {
                sh 'set +x -s curl "https://api.github.com/repos/sebamomann/anmeldesystem-backend/statuses/$GIT_COMMIT?access_token=$GITHUB_STATUS_ACCESS_TOKEN" \\\n' +
                        '  -H "Content-Type: application/json" \\\n' +
                        '  -X POST \\\n' +
                        '  -d "{\\"state\\": \\"success\\", \\"description\\": \\"Jenkins\\", \\"context\\": \\"continuous-integration/jenkins\\", \\"target_url\\": \\"https://jenkins.dankoe.de/job/anmeldesystem-backend-test/$BUILD_NUMBER/console\\"}" \\\n' +
                        '  /dev/null'
            }
        }
        failure {
            script {
                sh 'set +x -s curl "https://api.github.com/repos/sebamomann/anmeldesystem-backend/statuses/$GIT_COMMIT?access_token=$GITHUB_STATUS_ACCESS_TOKEN" \\\n' +
                        '  -H "Content-Type: application/json" \\\n' +
                        '  -X POST \\\n' +
                        '  -d "{\\"state\\": \\"failure\\", \\"description\\": \\"Jenkins\\", \\"context\\": \\"continuous-integration/jenkins\\", \\"target_url\\": \\"https://jenkins.dankoe.de/job/anmeldesystem-backend-test/$BUILD_NUMBER/console\\"}" \\\n' +
                        '  /dev/null'
            }
        }
    }
//    post {
//        always {
//            script {
//                try {
//                    sh 'docker container rm anmeldesystem-backend-newman -f'
//                } catch (err) {
//                    echo err.getMessage()
//                }
//
//                try {
//                    sh 'docker container rm newmanDB -f'
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
//    }
}

