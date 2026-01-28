# Hosting Guide - Shashti Karz

This document provides instructions on how to host the Shashti Karz platform on Vercel.

## Prerequisites

1.  A [Vercel](https://vercel.com) account.
2.  The project code pushed to a GitHub, GitLab, or Bitbucket repository.
3.  A [Supabase](https://supabase.com) project.
4.  A [Stripe](https://stripe.com) account (for payments).
5.  An SMTP server (e.g., Gmail, Zoho, SendGrid) for emails.

## Deployment Steps

### 1. Connect to Vercel

1.  Go to [Vercel](https://vercel.com/new).
2.  Import your repository.
3.  Choose **Next.js** as the Framework Preset.

### 2. Configure Environment Variables

In the Vercel project settings, add the following environment variables:

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase Service Role Key (Keep secret!) |
| `STRIPE_SECRET_KEY` | Your Stripe Secret Key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Your Stripe Publishable Key |
| `GEMINI_API_KEY` | Your Google Gemini AI API Key |
| `SMTP_HOST` | Your SMTP Host (e.g., `smtp.gmail.com`) |
| `SMTP_PORT` | `587` (TLS) or `465` (SSL) |
| `SMTP_USER` | Your SMTP Username |
| `SMTP_PASS` | Your SMTP Password |
| `FROM_EMAIL` | The Email address to send from (e.g., `Shashti Karz <updates@shashtikarz.com>`) |
| `NEXT_PUBLIC_APP_URL` | Your production URL (e.g., `https://shashti-karz.vercel.app`) |

### 3. Build Settings

- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

### 4. Supabase Setup

Ensure your Supabase database has the necessary tables and policies. If you haven't run the migrations yet, you can use the scripts provided in the project:
- `run-migration.js`
- `run_migration_ai_reviews.js`

*Note: You may need to update the Supabase URL and Key in these scripts or run the SQL in `sql/` directory directly in the Supabase SQL Editor.*

### 5. Stripe Webhooks (Optional but Recommended)

For better payment reliability, set up a Stripe Webhook:
1.  Go to Stripe Dashboard -> Developers -> Webhooks.
2.  Add an endpoint: `https://your-domain.com/api/webhooks/stripe`.
3.  Select events: `checkout.session.completed`.
4.  Add `STRIPE_WEBHOOK_SECRET` to your Vercel environment variables.

## Common Issues

- **Build Failures:** Ensure all dependencies are correctly listed in `package.json`. If you see TypeScript errors, you can bypass them by setting `ignoreBuildErrors: true` in `next.config.ts` (already enabled).
- **Email Issues:** If emails aren't sending, verify your SMTP credentials and ensure your provider allows connections from Vercel's IP ranges.
- **Supabase Auth:** Make sure to add your production URL to the "Redirect URLs" in Supabase Auth -> Settings -> Site URL.

---
Produced by Antigravity AI
