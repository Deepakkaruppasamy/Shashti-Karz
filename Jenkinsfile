pipeline {
    agent any

    environment {
        // Define your Docker Hub registry or any other registry
        DOCKER_REGISTRY = "docker.io"
        // Define your Docker Hub username
        DOCKER_HUB_USER = "deepakkaruppasamy"
        // Define your image name
        IMAGE_NAME = "shashti-karz-platform"
        // Define your credentials ID that was created in Jenkins
        DOCKER_CREDENTIALS_ID = "docker-hub-credentials"
        
        // Next.js build-time environment variables (should be set in Jenkins Credentials as Secret Text)
        SUPABASE_URL = credentials('SUPABASE_URL')
        SUPABASE_KEY = credentials('SUPABASE_KEY')
        STRIPE_KEY   = credentials('STRIPE_KEY')
        APP_URL      = credentials('APP_URL')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'npm ci'
            }
        }

        stage('Lint') {
            steps {
                bat 'npm run lint'
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    echo "Building Docker image ${IMAGE_NAME}:${env.BUILD_NUMBER}..."
                    // Use standard Docker build with build arguments for environment variables
                    bat """
                        docker build ^
                        --build-arg NEXT_PUBLIC_SUPABASE_URL=%SUPABASE_URL% ^
                        --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=%SUPABASE_KEY% ^
                        --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=%STRIPE_KEY% ^
                        --build-arg NEXT_PUBLIC_APP_URL=%APP_URL% ^
                        -t %IMAGE_NAME%:%BUILD_NUMBER% .
                    """
                    bat "docker tag %IMAGE_NAME%:%BUILD_NUMBER% %DOCKER_HUB_USER%/%IMAGE_NAME%:latest"
                    bat "docker tag %IMAGE_NAME%:%BUILD_NUMBER% %DOCKER_HUB_USER%/%IMAGE_NAME%:%BUILD_NUMBER%"
                }
            }
        }

        stage('Push to Registry') {
            steps {
                script {
                    // Use Jenkins Docker Pipeline plugin's credentials binding
                    withDockerRegistry([url: "https://${DOCKER_REGISTRY}", credentialsId: "${DOCKER_CREDENTIALS_ID}"]) {
                        echo "Pushing images to ${DOCKER_REGISTRY}..."
                        // Push the latest tag and the specific build number tag
                        bat "docker push %DOCKER_HUB_USER%/%IMAGE_NAME%:latest"
                        bat "docker push %DOCKER_HUB_USER%/%IMAGE_NAME%:%BUILD_NUMBER%"
                    }
                }
            }
        }

        stage('Cleanup') {
            steps {
                echo "Cleaning up local Docker images..."
                // Remove local images to save disk space
                bat "docker rmi %IMAGE_NAME%:%BUILD_NUMBER% || exit 0"
                bat "docker rmi %DOCKER_HUB_USER%/%IMAGE_NAME%:latest || exit 0"
                bat "docker rmi %DOCKER_HUB_USER%/%IMAGE_NAME%:%BUILD_NUMBER% || exit 0"
            }
        }
    }

    post {
        success {
            echo "CI/CD Pipeline finished successfully. Docker image version ${env.BUILD_NUMBER} pushed to registry!"
        }
        failure {
            echo "Pipeline failed! Please check the Jenkins logs."
        }
    }
}
