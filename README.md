# 🏎️ Shashti Karz - Premium Car Detailing Platform

Shashti Karz is a full-stack, enterprise-grade car detailing platform built with **Next.js**, **Supabase**, and **Stripe**. It features a robust DevOps stack including automated CI/CD pipelines, container orchestration, and a comprehensive monitoring system.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Docker & Docker Desktop
- Node.js 20+
- Git

### 2. Environment Setup
Create a `.env.local` file in the root directory (refer to `.env.example`).

### 3. Launch with Docker Compose (Recommended)
This is the most stable local setup. It launches the App + Monitoring Stack.
```powershell
docker-compose up -d
```
- **App**: [http://localhost:3000](http://localhost:3000)
- **Grafana**: [http://localhost:3001](http://localhost:3001) (User: `admin` / Pass: `admin`)
- **Prometheus**: [http://localhost:9090](http://localhost:9090)

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15+ (App Router), Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Payments**: Stripe Integration
- **Monitoring**: Prometheus, Grafana, cAdvisor, Node Exporter
- **CI/CD**: Jenkins, Docker Hub, Terraform
- **Infrastructure**: Render (Production), Kubernetes (Orchestration)

---

## 📊 Monitoring & Observability

The project includes a pre-configured monitoring stack:
- **Comprehensive DevOps Dashboard**: Visualize CPU, RAM, Disk, and Network traffic in real-time.
- **Docker Metrics**: Track individual container performance via cAdvisor.
- **Business KPIs**: Custom Prometheus metrics for Revenue and Bookings.
- **Alerting**: Slack notifications via Alertmanager for system criticalities.

---

## 🚀 CI/CD Pipeline

The project uses a sophisticated **Jenkins Pipeline** (`Jenkinsfile`):
1. **Checkout**: Pulls the latest code from GitHub.
2. **Build**: Creates a production Docker image using `Dockerfile`.
3. **Push**: Uploads the versioned image to Docker Hub.
4. **Terraform**: Automatically updates the infrastructure on **Render**.
5. **K8s Deploy**: (Optional) Deploys manifests to the Kubernetes cluster.

---

## 📂 Documentation Links

- [DevOps Implementation Guide](./DEVOPS_GUIDE.md) - Deep dive into K8s and Prometheus.
- [SEO Optimization Guide](./SEO_GUIDE.md) - How the app ranks on Google.
- [Docker Command Reference](./DOCKER_COMMANDS.md) - Useful commands for daily dev work.

---

## 🛡️ Security

- All secrets are managed via **Jenkins Credentials** and **Kubernetes Secrets**.
- Database security is handled via **Supabase Row Level Security (RLS)**.
- Sensitive environment variables are excluded from Git via `.gitignore`.

---

## 📄 License
Internal Property of Shashti Karz. All Rights Reserved.
