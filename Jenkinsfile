def image
def branch_name = "${env.BRANCH_NAME}" as String
def build_number = "${env.BUILD_NUMBER}" as String
def commit_hash

def tag_name = 'jb_' + branch_name + "_" + build_number

def api_image_name = 'anmeldesystem/anmeldesystem-backend:' + tag_name
def container_database_name = 'anmeldesystem_newman-testing_db_' + tag_name
def container_newman_name = 'anmeldesystem_newman-testing_newman_' + tag_name
def container_backend_name = 'anmeldesystem_newman-testing_backend_' + tag_name
def network_name = 'anmeldesystem_newman-testing_network_' + tag_name
def volume_name = 'anmeldesystem_newman-testing_volume_' + tag_name

pipeline {
    agent any

    environment {
        KEYCLOAK_TEST_GJM_ADMIN_PASSWORD = credentials('KEYCLOAK_TEST_GJM_ADMIN_PASSWORD')
        GITHUB_STATUS_ACCESS_TOKEN_SEBAMOMANN = credentials('GITHUB_STATUS_ACCESS_TOKEN_SEBAMOMANN')
    }

    options {
        ansiColor('xterm')
    }

    stages {
        stage('Preamble') {
            steps {
                script {
                    echo 'Updating status'
                    updateStatus("pending")
                }
                script {
                    commit_hash = sh(returnStdout: true, script: 'git rev-parse HEAD').trim()

                    echo 'Control Variables'
                    echo '-------------------'
                    echo "COMMIT HASH: ${commit_hash}"
                    echo "BRANCH NAME: ${branch_name}"
                    echo "BUILD NUMBER: ${build_number}"
                }
            }
        }


        stage('Build Docker image') {
            steps {
                script {
                    image = docker.build(api_image_name)
                }
            }
        }

        stage('Newman - preamble') {
            steps {
                script {
                    echo 'Spinup network'

                    try {
                        sh 'docker network create ' + network_name
                    } catch (err) {
                        echo err.getMessage()
                    }
                }
                script {
                    echo 'Spinup volume'

                    try {
                        sh 'docker volume create ' + volume_name
                    } catch (err) {
                        echo err.getMessage()
                    }
                }
            }
        }

        stage('Newman - spinup API and DB') {
            steps {
                script {
                    sh 'MYSQL_CONTAINER_NAME=' + container_database_name + ' ' +
                            'BACKEND_CONTAINER_NAME=' + container_backend_name + ' ' +
                            'API_IMAGE_NAME=' + api_image_name + ' ' +
                            'NEWMAN_CONTAINER_NAME=' + container_newman_name + ' ' +
                            'NETWORK_NAME=' + network_name + ' ' +
                            'KEYCLOAK_ADMIN_PASSWORD=$KEYCLOAK_TEST_GJM_ADMIN_PASSWORD ' +
                            'docker-compose -f newman-prepare.docker-compose.yml up ' +
                            '--detach'

                    timeout(5) {
                        waitUntil {
                            "healthy" == sh(returnStdout: true,
                                    script: "docker inspect " + container_backend_name + " --format=\"{{ .State.Health.Status }}\"").trim()
                        }
                    }
                }
            }
        }

        //Needs to be in extra step, because the backend is creating the DB Schema
        stage('Newman - populate database') {
            steps {
                script {
                    sh 'docker exec -i ' + container_database_name + ' mysql -uuser -ppassword anmeldesystem-newman < $(pwd)/test/testdata/data_I_main.sql'
                }
            }
        }

        stage('Newman - prepare volume') {
            steps {
                script {
                    sh 'docker container create --name temp_' + container_newman_name + ' -v ' + volume_name + ':/data busybox'
                    sh 'docker cp $(pwd)/test/collection/gjm.postman_collection.json temp_' + container_newman_name + ':/data/collection.json'
                    sh 'docker cp $(pwd)/test/testdata/files/testfile.pdf temp_' + container_newman_name + ':/data/testfile.pdf'
                    sh 'docker cp $(pwd)/test/testdata/files/testfile.txt temp_' + container_newman_name + ':/data/testfile.txt'
                    sh 'docker rm temp_' + container_newman_name
                }
            }
        }

        stage('Newman - execute') {
            steps {
                script {
                    sh 'docker run ' +
                            '-v ' + volume_name + ':/etc/newman ' +
                            '-v /var/www/vhosts/sebamomann.dankoe.de/additional_testing.dein.li/gjm-newman.postman_environment:/etc/newman/environment.json.postman_environment ' +
                            '--name ' + container_newman_name + ' ' +
                            '-p 3000:3000 ' +
                            '--net ' + network_name + ' ' +
                            '-t postman/newman:alpine ' +
                            'run "collection.json" ' +
                            '--environment="environment.json.postman_environment" ' +
                            '--env-var baseUrl=' + container_backend_name + ':3000 ' +
                            '-n 1 ' +
                            '--bail'
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
                    sh 'docker container rm ' + container_backend_name + ' -f -v'
                } catch (err) {
                    echo err.getMessage()
                }

                try {
                    sh 'docker container rm ' + container_newman_name + ' -f -v'
                } catch (err) {
                    echo err.getMessage()
                }

                try {
                    sh 'docker container rm ' + container_database_name + ' -f -v'
                } catch (err) {
                    echo err.getMessage()
                }

                try {
                    sh 'docker network rm ' + network_name
                } catch (err) {
                    echo err.getMessage()
                }

                try {
                    sh 'docker volume rm ' + volume_name + ' -f'
                } catch (err) {
                    echo err.getMessage()
                }

                try {
                    sh 'docker image rm ' + api_image_name + ' -f'
                } catch (err) {
                    echo err.getMessage()
                }
            }
        }
        success {
            script {
                updateStatus("success")

                try {
                    sh 'docker image prune --filter label=stage=intermediate -f --volumes'
                } catch (err) {
                    echo err.getMessage()
                }
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

