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
                            '--env MYSQL_ROOT_HOST=% ' +
                            '--name newmanDB ' +
                            '--net newmanNet ' +
                            '--health-cmd=\'stat /etc/passwd || exit 1 \' ' +
                            '--health-interval=2s ' +
                            'mysql'

                    retry(5){
                        sleep 10
                        HEALTH = sh (
                                script: 'docker inspect --format=\'{{json .State.Health.Status}}\' newmanDB',
                                returnStdout: true
                        ).trim()
                        echo "${HEALTH}"

                        if(HEALTH == "running"){
                            return true
                        }
                    }

                    sh 'docker exec newmanDB sh -c "mysql -u root password \'password\' -e \'grant all privileges on *.* to \'root\'@\'%\' identified by \'password\';\' -e \'flush privileges;\''

                    sh 'docker run -d ' +
                            '--name anmeldesystem-backend-newman ' +
                            '-p 34298:8080 ' +
                            '--env DB_USERNAME=root ' +
                            '--env DB_PASSWORD=password ' +
                            '--env DB_HOST=newmanDB  ' +
                            '--env DB_PORT=34299 ' +
                            '--env DB_NAME=anmeldesystem-api ' +
                            '--env SALT_JWT=salt ' +
                            '--env SALT_MAIL=salt ' +
                            '--env SALT_ENROLLMENT=salt ' +
                            '--env DOMAIN=go-join.me ' +
                            '--net newmanNet ' +
                            '--health-cmd=\'stat /etc/passwd || exit 1 \' ' +
                            '--health-interval=2s ' +
                            'anmeldesystem/anmeldesystem-backend:latest'

                    retry(5){
                        sleep 10
                        HEALTH = sh (
                                script: 'docker inspect --format=\'{{json .State.Health.Status}}\' anmeldesystem-backend-newman',
                                returnStdout: true
                        ).trim()
                        echo "${HEALTH}"

                        if(HEALTH == "running"){
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
                            '--net newmanNet ' +
                            '-t postman/newman:alpine ' +
                            'run "https://raw.githubusercontent.com/sebamomann/anmeldesystem-backend/test/collection.json"'
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
