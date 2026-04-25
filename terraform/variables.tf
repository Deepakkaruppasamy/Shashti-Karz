# ─────────────────────────────────────────
# Render Provider Variables
# ─────────────────────────────────────────

variable "render_api_key" {
  description = "Render API key — found in Render Dashboard > Account Settings > API Keys"
  type        = string
  sensitive   = true
}

variable "render_owner_id" {
  description = "Render owner/team ID — found in Render Dashboard URL (usr-xxxxx or tea-xxxxx)"
  type        = string
}

variable "render_docker_credential_id" {
  description = "Render Docker Hub credential ID — add in Render Dashboard > Registry Credentials"
  type        = string
  default     = ""
}

# ─────────────────────────────────────────
# Docker Hub Variables
# ─────────────────────────────────────────

variable "docker_hub_user" {
  description = "Docker Hub username"
  type        = string
  default     = "deepakkaruppasamy"
}

variable "image_name" {
  description = "Docker image name"
  type        = string
  default     = "shashti-karz"
}

# ─────────────────────────────────────────
# App Config Variables
# ─────────────────────────────────────────

variable "custom_domain" {
  description = "Custom domain for the app"
  type        = string
  default     = "shashtikarz.app"
}

variable "app_url" {
  description = "Public URL of the app"
  type        = string
  default     = "https://shashtikarz.app"
}

# ─────────────────────────────────────────
# Application Secrets (mark all sensitive)
# ─────────────────────────────────────────

variable "supabase_url" {
  description = "Supabase project URL"
  type        = string
  sensitive   = true
}

variable "supabase_anon_key" {
  description = "Supabase anon (public) key"
  type        = string
  sensitive   = true
}

variable "supabase_service_role_key" {
  description = "Supabase service role key"
  type        = string
  sensitive   = true
}

variable "stripe_publishable_key" {
  description = "Stripe publishable key"
  type        = string
  sensitive   = true
}

variable "stripe_secret_key" {
  description = "Stripe secret key"
  type        = string
  sensitive   = true
}

variable "metrics_secret" {
  description = "Secret token for /api/metrics endpoint"
  type        = string
  sensitive   = true
}
