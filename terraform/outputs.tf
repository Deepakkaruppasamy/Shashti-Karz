# ─────────────────────────────────────────
# Terraform Outputs — Shashti Karz on Render
# ─────────────────────────────────────────

output "service_id" {
  description = "Render service ID"
  value       = render_web_service.shashti_karz.id
}

output "service_url" {
  description = "Default Render .onrender.com URL"
  value       = render_web_service.shashti_karz.url
}

output "custom_domain_url" {
  description = "Custom domain URL"
  value       = "https://${var.custom_domain}"
}

output "image_deployed" {
  description = "Docker image currently deployed"
  value       = "docker.io/${var.docker_hub_user}/${var.image_name}:latest"
}
