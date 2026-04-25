pipeline {
    agent any

    environment {
        DOCKER_REGISTRY          = "docker.io"
        DOCKER_HUB_USER          = "deepakkaruppasamy"
        IMAGE_NAME               = "shashti-karz"
        DOCKER_CREDENTIALS_ID    = "docker-hub-credentials"

        // App secrets from Jenkins Credentials store
        SUPABASE_URL  = credentials('SUPABASE_URL')
        SUPABASE_KEY  = credentials('SUPABASE_KEY')
        STRIPE_KEY    = credentials('STRIPE_KEY')
        APP_URL       = credentials('APP_URL')
        METRICS_KEY   = credentials('METRICS_SECRET')

        // Terraform credentials for Render
        RENDER_API_KEY  = credentials('RENDER_API_KEY')    // Add in Jenkins > Credentials
        RENDER_OWNER_ID = credentials('RENDER_OWNER_ID')   // Add in Jenkins > Credentials
 
        // Kubernetes config from Secret File
        KUBECONFIG_PATH = credentials('KUBECONFIG_FILE')   // Add in Jenkins > Credentials (Secret File)

        // Terraform configuration
        TF_DIR     = "terraform"
        TF_COMMAND = "C:\\terraform\\terraform.exe" // Absolute path for Jenkins service
    }

    stages {

        // ─────────────────────────────────────────
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        // ─────────────────────────────────────────
        stage('Install Dependencies') {
            steps {
                bat 'npm ci'
            }
        }

        // ─────────────────────────────────────────
        stage('Build Docker Image') {
            steps {
                script {
                    echo "Building Docker image ${IMAGE_NAME}:${env.BUILD_NUMBER}..."
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

        // ─────────────────────────────────────────
        stage('Push to Docker Hub') {
            steps {
                script {
                    echo "Pushing image to Docker Hub..."
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

        // ─────────────────────────────────────────
        // TERRAFORM — Manages Render infrastructure
        // Applies config to ensure Render service is
        // up-to-date with the latest Docker image.
        // ─────────────────────────────────────────
        stage('Terraform Init') {
            steps {
                script {
                    echo "Initializing Terraform..."
                    bat "cd %TF_DIR% && %TF_COMMAND% init -input=false"
                }
            }
        }

        stage('Terraform Plan') {
            steps {
                script {
                    echo "Running Terraform plan..."
                    bat """
                        cd %TF_DIR% && %TF_COMMAND% plan ^
                        -var="render_api_key=%RENDER_API_KEY%" ^
                        -var="render_owner_id=%RENDER_OWNER_ID%" ^
                        -var="supabase_url=%SUPABASE_URL%" ^
                        -var="supabase_anon_key=%SUPABASE_KEY%" ^
                        -var="supabase_service_role_key=%SUPABASE_KEY%" ^
                        -var="stripe_publishable_key=%STRIPE_KEY%" ^
                        -var="stripe_secret_key=%STRIPE_KEY%" ^
                        -var="metrics_secret=%METRICS_KEY%" ^
                        -out=tfplan ^
                        -input=false
                    """
                }
            }
        }

        stage('Terraform Apply') {
            steps {
                script {
                    echo "Applying Terraform — updating Render service..."
                    bat "cd %TF_DIR% && %TF_COMMAND% apply -input=false -auto-approve tfplan"
                }
            }
        }

        // ─────────────────────────────────────────
        // KUBERNETES — Deploy manifests to cluster
        // Only runs if KUBECONFIG is configured.
        // For Minikube: set KUBECONFIG in Jenkins env.
        // ─────────────────────────────────────────
        stage('Deploy to Kubernetes') {
            when {
                // Only run K8s deploy if KUBECONFIG_PATH is available
                expression { return env.KUBECONFIG_PATH != null && env.KUBECONFIG_PATH != '' }
            }
            steps {
                script {
                    echo "Deploying to Kubernetes cluster..."
                    
                    // Set KUBECONFIG for this block
                    withEnv(["KUBECONFIG=${env.KUBECONFIG_PATH}"]) {
                        // Apply namespace first
                        bat "kubectl apply -f k8s/namespace.yaml"

                        // Inject secrets from Jenkins credentials
                        bat """
                            kubectl create secret generic shashti-karz-secrets ^
                            --from-literal=NEXT_PUBLIC_SUPABASE_URL=%SUPABASE_URL% ^
                            --from-literal=NEXT_PUBLIC_SUPABASE_ANON_KEY=%SUPABASE_KEY% ^
                            --from-literal=SUPABASE_SERVICE_ROLE_KEY=%SUPABASE_KEY% ^
                            --from-literal=NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=%STRIPE_KEY% ^
                            --from-literal=STRIPE_SECRET_KEY=%STRIPE_KEY% ^
                            --from-literal=NEXT_PUBLIC_APP_URL=%APP_URL% ^
                            --from-literal=METRICS_SECRET=%METRICS_KEY% ^
                            -n shashti-karz ^
                            --dry-run=client -o yaml | kubectl apply -f -
                        """

                        // Apply all manifests
                        bat "kubectl apply -f k8s/app-deployment.yaml"
                        bat "kubectl apply -f k8s/prometheus-deployment.yaml"
                        bat "kubectl apply -f k8s/grafana-deployment.yaml"
                        bat "kubectl apply -f k8s/alertmanager-deployment.yaml"
                        bat "kubectl apply -f k8s/ingress.yaml"
                        bat "kubectl apply -f k8s/hpa.yaml"

                        // Force pull the latest image
                        bat "kubectl rollout restart deployment/shashti-karz-app -n shashti-karz"

                        // Wait for rollout to complete
                        bat "kubectl rollout status deployment/shashti-karz-app -n shashti-karz --timeout=120s"
 
                        echo "Kubernetes deployment complete!"
                    }
                }
            }
        }

        // ─────────────────────────────────────────
        stage('Cleanup') {
            steps {
                echo "Cleaning up local Docker images..."
                bat "docker rmi %IMAGE_NAME%:%BUILD_NUMBER% || exit 0"
                bat "docker rmi %DOCKER_HUB_USER%/%IMAGE_NAME%:latest || exit 0"
                bat "docker rmi %DOCKER_HUB_USER%/%IMAGE_NAME%:%BUILD_NUMBER% || exit 0"
            }
        }
    }

    post {
        success {
            echo """
            ✅ Pipeline SUCCESS — Build #${env.BUILD_NUMBER}
            - Docker image pushed: ${DOCKER_HUB_USER}/${IMAGE_NAME}:${env.BUILD_NUMBER}
            - Terraform applied: Render service updated
            - Live at: https://shashtikarz.app
            """
        }
        failure {
            echo "❌ Pipeline FAILED — Check Jenkins logs for details."
        }
        always {
            // Clean Terraform plan file
            bat "if exist terraform\\tfplan del terraform\\tfplan"
        }
    }
}
