terraform {
  required_version = ">= 1.5.0"

  required_providers {
    render = {
      source  = "render-oss/render"
      version = "~> 1.3"
    }
  }

  # Optional: Use Terraform Cloud or S3 for remote state.
  # For local state, comment out this block.
  # backend "s3" {
  #   bucket = "shashti-karz-terraform-state"
  #   key    = "prod/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "render" {
  api_key = var.render_api_key
  owner_id = var.render_owner_id
}

# ─────────────────────────────────────────────
# Shashti Karz — Next.js Web Service on Render
# ─────────────────────────────────────────────
resource "render_web_service" "shashti_karz" {
  name   = "shashti-karz"
  plan   = "free"
  region = "oregon"

  runtime_source = {
    docker = {
      registry_credential_id = var.render_docker_credential_id
      image = {
        image_url = "docker.io/${var.docker_hub_user}/${var.image_name}:latest"
      }
    }
  }

  env_vars = {
    NODE_ENV = {
      value = "production"
    }
    NEXT_PUBLIC_APP_URL = {
      value = var.app_url
    }
    NEXT_PUBLIC_SUPABASE_URL = {
      value = var.supabase_url
    }
    NEXT_PUBLIC_SUPABASE_ANON_KEY = {
      value = var.supabase_anon_key
    }
    SUPABASE_SERVICE_ROLE_KEY = {
      value = var.supabase_service_role_key
    }
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = {
      value = var.stripe_publishable_key
    }
    STRIPE_SECRET_KEY = {
      value = var.stripe_secret_key
    }
    METRICS_SECRET = {
      value = var.metrics_secret
    }
  }

  secret_files = {}
}

# ─────────────────────────────────────────────
# Custom Domain: shashtikarz.app
# ─────────────────────────────────────────────
resource "render_custom_domain" "primary_domain" {
  service_id  = render_web_service.shashti_karz.id
  name        = var.custom_domain
}
