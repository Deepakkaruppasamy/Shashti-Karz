# 🚀 Shashti Karz — DevOps Infrastructure Guide

This project now includes professional-grade Infrastructure as Code (Terraform) and Container Orchestration (Kubernetes).

## 🛠️ Tech Stack Added
- **Terraform**: Manages Render services, environment variables, and domains.
- **Kubernetes**: Production-ready manifests for the app and full monitoring stack (Prometheus, Grafana, Alertmanager).

---

## 🏗️ Terraform (Infrastructure as Code)
Located in `/terraform`.

### Prerequisites
1. Install [Terraform CLI](https://developer.hashicorp.com/terraform/downloads).
2. Get your **Render API Key** and **Owner ID** from the Render Dashboard.

### Setup
1. `cd terraform`
2. `cp terraform.tfvars.example terraform.tfvars`
3. Fill in your real secrets in `terraform.tfvars`.
4. `terraform init`
5. `terraform apply`

---

## ☸️ Kubernetes (Orchestration)
Located in `/k8s`.

### Local Testing (Minikube)
1. Start minikube: `minikube start`
2. Apply all configs: `kubectl apply -f k8s/`
3. Access the app: `minikube service shashti-karz-service -n shashti-karz`

### Manifests Included:
- `namespace.yaml`: Isolates the project.
- `app-deployment.yaml`: Runs 2 replicas of the Next.js app.
- `prometheus-deployment.yaml`: Scrapes metrics from `/api/metrics`.
- `grafana-deployment.yaml`: Visualization dashboard (pre-configured).
- `alertmanager-deployment.yaml`: Slack alerting integration.
- `ingress.yaml`: Routing and TLS configuration.
- `hpa.yaml`: Auto-scales the app based on CPU/RAM usage.

---

## 🤖 Jenkins Pipeline
The `Jenkinsfile` has been updated to:
1. **Build & Push** Docker image to Docker Hub.
2. **Terraform Apply**: Automatically update Render with the latest image and environment variables.
3. **K8s Deploy**: (Optional) Deploy to a Kubernetes cluster if `KUBECONFIG` is present in Jenkins.

### Jenkins Secrets Required:
Ensure these are added to Jenkins Credentials:
- `RENDER_API_KEY` (Secret Text)
- `RENDER_OWNER_ID` (Secret Text)
- `DOCKER_HUB_USER` / `DOCKER_PASS` (Username/Password)
- All app secrets (`SUPABASE_URL`, `STRIPE_KEY`, etc.)
