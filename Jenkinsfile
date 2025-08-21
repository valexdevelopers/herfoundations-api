pipeline {
    agent any

    environment {
        AWS_REGION = 'eu-north-1'
        ACCOUNT_ID = credentials('aws_account_id')
        GITHUB_TOKEN = credentials('GITHUB-ACCESS-TOKEN')
        EC2_HOST = credentials('EC2_HOST') 
        SSH_KEY = credentials('EC2_DEPLOY_KEY')
    }

    options {
        disableConcurrentBuilds()
        timestamps()
    }

    stages {
        stage('Branch been built'){
            steps{
                script {
                    echo "CHANGE ID and branch details"
                    echo "CHANGE_ID: ${env.CHANGE_ID}"
                    echo "CHANGE_BRANCH: ${env.CHANGE_BRANCH}"
                    echo "CHANGE_TARGET: ${env.CHANGE_TARGET}"
                    echo "BRANCH_NAME: ${env.BRANCH_NAME}"
                }
            }
        }
        stage('Checkout code') {
            steps {
                script {
                    def branchName = env.CHANGE_BRANCH ? env.CHANGE_BRANCH : 'master'
                    env.BRANCH_NAME = branchName
                    echo "Checking out branch: ${branchName}"

                    checkout([
                        $class: 'GitSCM',
                        branches: [[name: "*/${branchName}"]],
                        userRemoteConfigs: [[
                            url: "https://${GITHUB_TOKEN}@github.com/valexdevelopers/herfoundations-api.git"
                        ]]
                    ])
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing npm dependencies...'
                sh 'npm ci'
            }
        }

        stage('Build') {
            steps {
                echo 'Building the project ...'
                timeout(time: 10, unit: 'MINUTES') {
                    sh 'npm run build'
                }
                echo 'Build completed successfully.'
            }
        }

       

        stage('Deploy') {
            steps {
                script {
                    deployService(
                        envFile: "ENV_FILE"
                    )
                }
            }
        }

        stage('Cleanup Workspace for next build') {
            steps {
                cleanWs()
            }
        }
    }

    post {
        success {
            echo "Build succeeded."
            script {
                updateGitHubStatus('success', 'The build succeeded.')
            }
        }
        failure {
            echo "Build failed."
            script {
                updateGitHubStatus('failure', 'The build failed.')
            }
        }
        unstable {
            echo "Build is unstable."
            script {
                updateGitHubStatus('failure', 'The build is unstable.')
            }
        }
    }
}

def deployService(Map svc) {
    def envFileCredentialId = svc.envFile

    withCredentials([file(credentialsId: envFileCredentialId, variable: 'ENV_FILE')]) {
        sh '''#!/bin/bash
        set -e

        echo "Preparing to copy env file: $ENV_FILE"
        ls -la
        rm -f .env || true
        touch .env
        chmod +w .env
        echo "Copying env file: $ENV_FILE"
        cp "$ENV_FILE" .env
        '''
    }

    // Docker build, tag, push and ECS update with double triple quotes
    withCredentials([file(credentialsId: envFileCredentialId, variable: 'ENV_FILE')]) {
        sh """
            ls -la
            rm -f .env || true
            echo "Copying env file into .env"
            cp "$ENV_FILE" .env

            echo "Removing old tar.gz if it exists..."
            rm -rf herfoundations.tar.gz || true
            rm -rf dist || true
            rm -rf temporary || true


            echo "Lets know where we are..."
            pwd
            ls -la

            rm -rf temporary || true
            mkdir -p temporary
            chmod -R 755 temporary

            echo "Copying to temporary directory"
            rsync -av --exclude=temporary/ --exclude=node_modules/ ./ temporary/
            cp -r .env package.json package-lock.json temporary/
            ls -la temporary/

            echo "Installing dependencies"
            cd temporary && npm install

            echo "npm running Build"
            npx prisma generate
            npm run build
 

            echo "Creating herfoundations.tar.gz with microservice and config files and Compressing artifacts..."
            cd ..
            
            tar -czf herfoundations.tar.gz temporary/dist temporary/apps temporary/package.json temporary/package-lock.json temporary/.env
            pwd
            ls -la
            
        """

        sshagent(credentials: ['EC2_DEPLOY_KEY']) {
            sh """
                echo "Listing contents of working directory..."
                pwd
                ls -la

                echo "Listing contents of EC2 home directory..."
                ssh -o StrictHostKeyChecking=no ${EC2_HOST} "ls -la /home/ubuntu"

                echo "Copying project files to EC2"
                scp -o StrictHostKeyChecking=no herfoundations.tar.gz ${EC2_HOST}:/home/ubuntu/
                ssh -o StrictHostKeyChecking=no ${EC2_HOST} "ls -l /home/ubuntu/herfoundations.tar.gz"

                echo "Cleaning old service directory and preparing fresh deploy dir"
                ssh -o StrictHostKeyChecking=no ${EC2_HOST} "
                    rm -rf /home/ubuntu/herfoundations || true && \
                    mkdir -p /home/ubuntu/herfoundations
                "
                echo "Creating service directory if needed and extracting..."
                ssh -o StrictHostKeyChecking=no ${EC2_HOST} "tar -xzf /home/ubuntu/herfoundations.tar.gz -C /home/ubuntu/herfoundations"

                echo "Changing into service directory"
                ssh -o StrictHostKeyChecking=no ${EC2_HOST} "cd /home/ubuntu/herfoundations && ls -la && cp -r temporary/* ."

                echo "Installing dependencies"
                ssh -o StrictHostKeyChecking=no ${EC2_HOST} "cd /home/ubuntu/herfoundations && yarn install --production"

                echo "Checking if port 8000 is in use and killing the process if needed"
                ssh -o StrictHostKeyChecking=no ${EC2_HOST} "
                    PID=\$(lsof -ti tcp:8000)
                    if [ ! -z \"\$PID\" ]; then
                        echo \"Killing process using port 8000: \$PID\"
                        kill -9 \$PID
                    else
                        echo \"No process found using port 8000\"
                    fi
                "

                echo "Starting service in production"
                ssh -o StrictHostKeyChecking=no ${EC2_HOST} "
                    cd /home/ubuntu/herfoundations &&
                    cp temporary/.env .env &&
                    ls
                    cat .env
                    nohup npm run start > herfoundations.log 2>&1 &
                    disown
                "
                echo "herfoundations started and detached successfully"
            """
        }

    }
}


def updateGitHubStatus(status, description) {
    def repoOwner = 'valexdevelopers'
    def repoName = 'herfoundations-api'
    def apiUrl = "https://api.github.com/repos/${repoOwner}/${repoName}/statuses/${GIT_COMMIT}"

    def payload = new groovy.json.JsonBuilder([
        state: status,
        description: description,
        context: "continuous-integration/jenkins"
    ]).toString()

    echo "Sending GitHub status update..."

    def response = sh(
        script: """
        curl -L \
            -X POST \
            -H "Accept: application/vnd.github+json" \
            -H "Authorization: Bearer ${GITHUB_TOKEN}" \
            -H "X-GitHub-Api-Version: 2022-11-28" \
            -d '${payload}' \
            ${apiUrl}
        """,
        returnStdout: true
    ).trim()

    echo "GitHub Status Response: ${response}"
    
}
