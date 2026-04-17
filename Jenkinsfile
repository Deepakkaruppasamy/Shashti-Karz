pipeline {
    agent any

    environment {
        // Define your Docker Hub registry or any other registry
        DOCKER_REGISTRY = "docker.io"
        // Define your Docker Hub username
        DOCKER_HUB_USER = "deepakkaruppasamy"
        // Define your image name
        IMAGE_NAME = "shashti-karz"
        // Define your credentials ID that was created in Jenkins
        DOCKER_CREDENTIALS_ID = "docker-hub-credentials"
        
        // Next.js build-time environment variables (should be set in Jenkins Credentials as Secret Text)
        SUPABASE_URL = credentials('SUPABASE_URL')
        SUPABASE_KEY = credentials('SUPABASE_KEY')
        STRIPE_KEY   = credentials('STRIPE_KEY')
        APP_URL      = credentials('APP_URL')
        METRICS_KEY  = credentials('METRICS_SECRET')
        
        // Security Credentials (Uncomment and add to Jenkins when ready)
        // SONAR_TOKEN = credentials('SONAR_TOKEN')
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

        stage('SonarQube Static Analysis') {
            steps {
                script {
                    echo "Running SonarQube code scanning..."
                    // We use catchError so it doesn't break your pipeline until you configure a real SonarQube server
                    catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                        bat """
                        npx sonar-scanner ^
                          -Dsonar.projectKey=%IMAGE_NAME% ^
                          -Dsonar.sources=src ^
                          -Dsonar.host.url=http://localhost:9000
                        """
                        // Note: To authenticate, add: -Dsonar.login=%SONAR_TOKEN%
                    }
                }
            }
        }


        stage('Build Docker Image') {
            steps {
                script {
                    echo "Building Docker image ${IMAGE_NAME}:${env.BUILD_NUMBER}..."
                    // Use standard Docker build with build arguments for environment variables
                    bat """
                        docker build ^
                        --build-arg SUPABASE_SERVICE_ROLE_KEY=%SUPABASE_KEY% ^
                        --build-arg NEXT_PUBLIC_SUPABASE_URL=%SUPABASE_URL% ^
                        --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=%SUPABASE_KEY% ^
                        --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=%STRIPE_KEY% ^
                        --build-arg STRIPE_SECRET_KEY=%STRIPE_KEY% ^
                        --build-arg NEXT_PUBLIC_APP_URL=%APP_URL% ^
                        --build-arg METRICS_SECRET=%METRICS_KEY% ^
                        -t %IMAGE_NAME%:%BUILD_NUMBER% .
                    """
                    bat "docker tag %IMAGE_NAME%:%BUILD_NUMBER% %DOCKER_HUB_USER%/%IMAGE_NAME%:latest"
                    bat "docker tag %IMAGE_NAME%:%BUILD_NUMBER% %DOCKER_HUB_USER%/%IMAGE_NAME%:%BUILD_NUMBER%"
                }
            }
        }

        stage('Trivy Image Scan') {
            steps {
                script {
                    echo "Scanning image %IMAGE_NAME%:%BUILD_NUMBER% for HIGH & CRITICAL vulnerabilities..."
                    // We run Trivy as a Docker container to scan the local image
                    // --exit-code 0 prints the report without failing the build. 
                    // Change to --exit-code 1 to block bad builds from deploying.
                    catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                        bat """
                        docker run --rm ^
                          -v /var/run/docker.sock:/var/run/docker.sock ^
                          aquasec/trivy image ^
                          --severity HIGH,CRITICAL ^
                          --exit-code 0 ^
                          --ignore-unfixed ^
                          %IMAGE_NAME%:%BUILD_NUMBER%
                        """
                    }
                }
            }
        }

        stage('Push to Registry') {
            steps {
                script {
                    echo "Logging into Docker Hub manually..."
                    withCredentials([usernamePassword(
                        credentialsId: "${DOCKER_CREDENTIALS_ID}",
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )]) {
                        bat """
                        docker logout
                        docker login -u %DOCKER_USER% -p %DOCKER_PASS%
                        docker push %DOCKER_HUB_USER%/%IMAGE_NAME%:latest
                        docker push %DOCKER_HUB_USER%/%IMAGE_NAME%:%BUILD_NUMBER%
                        docker logout
                        """
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
