# ============================================================
#   SHASHTI KARZ — Docker Commands Reference
#   Project: https://github.com/Deepakkaruppasamy/Shashti-Karz
#   App URL: https://shashtikarz.app
# ============================================================


# ─────────────────────────────────────────────
# 1. FULL MONITORING STACK (Recommended)
# ─────────────────────────────────────────────

# Start all services: App + Prometheus + Grafana + Alertmanager + Node Exporter + cAdvisor
docker-compose up -d

# Start with rebuild (after code changes)
docker-compose up --build -d

# Rebuild only the app (fastest for code-only changes)
docker-compose up -d --build app

# Force recreate a specific service (reload env vars)
docker-compose up -d --force-recreate app

# Stop all services
docker-compose down

# Stop and delete volumes (full reset — clears Grafana/Prometheus data)
docker-compose down -v


# ─────────────────────────────────────────────
# 2. BUILD DOCKER IMAGE MANUALLY
# ─────────────────────────────────────────────

docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=your_value \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your_value \
  --build-arg SUPABASE_SERVICE_ROLE_KEY=your_value \
  --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_value \
  --build-arg STRIPE_SECRET_KEY=your_value \
  --build-arg NEXT_PUBLIC_APP_URL=https://shashtikarz.app \
  --build-arg METRICS_SECRET=your_metrics_secret \
  -t deepakkaruppasamy/shashti-karz:latest .


# ─────────────────────────────────────────────
# 3. RUN APP CONTAINER ONLY (without Compose)
# ─────────────────────────────────────────────

docker run -d -p 3000:3000 \
  --name shashti-karz-app \
  --env-file .env \
  deepakkaruppasamy/shashti-karz:latest


# ─────────────────────────────────────────────
# 4. PUSH IMAGE TO DOCKER HUB
# ─────────────────────────────────────────────

docker login
docker tag deepakkaruppasamy/shashti-karz:latest deepakkaruppasamy/shashti-karz:$(date +%Y%m%d)
docker push deepakkaruppasamy/shashti-karz:latest


# ─────────────────────────────────────────────
# 5. RESTART INDIVIDUAL SERVICES
# ─────────────────────────────────────────────

docker-compose restart app
docker-compose restart prometheus
docker-compose restart grafana
docker-compose restart alertmanager


# ─────────────────────────────────────────────
# 6. VIEW LOGS
# ─────────────────────────────────────────────

# Follow logs for a specific service
docker-compose logs -f app
docker-compose logs -f prometheus
docker-compose logs -f grafana
docker-compose logs -f alertmanager

# Last 50 lines
docker-compose logs --tail=50 app


# ─────────────────────────────────────────────
# 7. INSPECT RUNNING CONTAINERS
# ─────────────────────────────────────────────

# List all running containers
docker ps

# Check resource usage (CPU, Memory)
docker stats

# Open a shell inside the app container
docker exec -it shashtikarz-app-1 sh


# ─────────────────────────────────────────────
# 8. PROMETHEUS — RELOAD CONFIG (no restart)
# ─────────────────────────────────────────────

curl -X POST http://localhost:9090/-/reload


# ─────────────────────────────────────────────
# 9. VOLUME MANAGEMENT
# ─────────────────────────────────────────────

# List all volumes
docker volume ls

# Reset only Grafana data (clears dashboards/settings stored in DB)
docker volume rm shashtikarz_grafana_data

# Reset only Prometheus data (clears all time-series history)
docker volume rm shashtikarz_prometheus_data

# Remove all unused volumes (cleanup)
docker volume prune


# ─────────────────────────────────────────────
# 10. ACCESS POINTS
# ─────────────────────────────────────────────

# Application
Frontend:       http://localhost:3000
Production:     https://shashtikarz.app

# Monitoring
Grafana:        http://localhost:3001   (admin / admin)
Prometheus:     http://localhost:9090
Alertmanager:   http://localhost:9093

# Metrics endpoint (replace secret as needed)
Metrics API:    http://localhost:3000/api/metrics?token=your_metrics_secret_here


# ─────────────────────────────────────────────
# 11. QUICK HEALTH CHECK
# ─────────────────────────────────────────────

# Check all services are UP
docker-compose ps

# Test metrics endpoint is responding
curl -s "http://localhost:3000/api/metrics?token=your_metrics_secret_here" | head -20

# Check Prometheus targets
curl -s http://localhost:9090/api/v1/targets | python -m json.tool
