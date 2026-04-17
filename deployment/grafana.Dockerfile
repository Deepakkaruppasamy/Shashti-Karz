FROM grafana/grafana:latest
COPY grafana/provisioning /etc/grafana/provisioning
ENV GF_SECURITY_ADMIN_PASSWORD=admin
ENV GF_USERS_ALLOW_SIGN_UP=false
