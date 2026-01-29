# 🔑 API Keys Setup Guide

## Complete step-by-step guide to get all required API keys

---

## 1. 🟢 Google Maps API (Required for Route Optimization)

### **Step 1: Create Google Cloud Project**
1. Go to https://console.cloud.google.com/
2. Click **"Select a project"** → **"New Project"**
3. Enter project name: `Shashti-Karz`
4. Click **"Create"**

### **Step 2: Enable Required APIs**
1. In the search bar, type **"Maps JavaScript API"** → Click **"Enable"**
2. Search **"Directions API"** → Click **"Enable"**
3. Search **"Distance Matrix API"** → Click **"Enable"**
4. Search **"Places API"** → Click **"Enable"**
5. Search **"Geocoding API"** → Click **"Enable"**

### **Step 3: Create API Key**
1. Go to **"Credentials"** (left sidebar)
2. Click **"+ CREATE CREDENTIALS"** → **"API key"**
3. Copy the API key (looks like: `AIzaSyC...`)
4. Click **"Edit API key"** (pencil icon)

### **Step 4: Restrict API Key (Important for Security)**
1. **Application restrictions:**
   - Select **"HTTP referrers (web sites)"**
   - Add your domain: `https://yourdomain.com/*`
   - Add localhost: `http://localhost:3000/*`

2. **API restrictions:**
   - Select **"Restrict key"**
   - Check these APIs:
     - ✅ Maps JavaScript API
     - ✅ Directions API
     - ✅ Distance Matrix API
     - ✅ Places API
     - ✅ Geocoding API

3. Click **"Save"**

### **Step 5: Enable Billing (Required)**
1. Go to **"Billing"** in left sidebar
2. Click **"Link a billing account"**
3. Add credit card (Google gives $200 free credit/month)
4. **Note:** You likely won't exceed free tier for car detailing business

### **Add to .env.local:**
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyC...your-key-here
```

**Cost:** FREE for up to:
- 28,000 map loads/month
- 40,000 directions requests/month
- More than enough for your business!

---

## 2. 💬 WhatsApp Business API (Required for WhatsApp Integration)

### **Option A: Meta Business (Official - Recommended)**

#### **Step 1: Create Meta Business Account**
1. Go to https://business.facebook.com/
2. Click **"Create Account"**
3. Enter business name: `Shashti Karz`
4. Fill in business details
5. Verify your business (may take 1-2 days)

#### **Step 2: Set Up WhatsApp Business**
1. Go to https://business.facebook.com/wa/manage/home/
2. Click **"Get Started"**
3. Select **"Use a phone number"**
4. Enter your business phone number
5. Verify with OTP

#### **Step 3: Create WhatsApp Business App**
1. Go to https://developers.facebook.com/
2. Click **"My Apps"** → **"Create App"**
3. Select **"Business"** → Click **"Next"**
4. Enter app name: `Shashti Karz WhatsApp`
5. Click **"Create App"**

#### **Step 4: Add WhatsApp Product**
1. In your app dashboard, find **"WhatsApp"**
2. Click **"Set Up"**
3. Select your business account
4. Click **"Continue"**

#### **Step 5: Get API Credentials**
1. Go to **"WhatsApp"** → **"Getting Started"**
2. Copy these values:
   - **Phone Number ID** (looks like: `123456789012345`)
   - **WhatsApp Business Account ID**
   - **Temporary Access Token** (valid 24 hours)

#### **Step 6: Generate Permanent Access Token**
1. Go to **"Settings"** → **"Basic"**
2. Copy **"App ID"** and **"App Secret"**
3. Go to **"WhatsApp"** → **"Configuration"**
4. Generate **System User Token** (never expires)

#### **Step 7: Configure Webhook**
1. In WhatsApp settings, click **"Configuration"**
2. Click **"Edit"** next to Webhook
3. Enter:
   - **Callback URL:** `https://yourdomain.com/api/whatsapp/webhook`
   - **Verify Token:** `shashti_karz_verify_token` (you choose this)
4. Click **"Verify and Save"**
5. Subscribe to these fields:
   - ✅ messages
   - ✅ message_status

#### **Step 8: Add Phone Number to Whitelist**
1. Go to **"WhatsApp"** → **"Getting Started"**
2. Click **"Add phone number"**
3. Add test numbers (up to 5 for testing)

### **Add to .env.local:**
```env
WHATSAPP_VERIFY_TOKEN=shashti_karz_verify_token
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxx
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345
```

**Cost:** 
- **FREE** for first 1,000 conversations/month
- Then ₹0.50-₹1.50 per conversation
- Very affordable for small business!

---

### **Option B: Third-Party Providers (Easier Setup)**

If Meta verification is taking too long, use these:

#### **1. Twilio WhatsApp API**
1. Go to https://www.twilio.com/whatsapp
2. Sign up for free trial
3. Get $15 free credit
4. Follow their WhatsApp setup wizard
5. Get API credentials from dashboard

**Pros:** Easier setup, faster approval
**Cons:** Slightly more expensive (₹0.50/message)

#### **2. MessageBird**
1. Go to https://messagebird.com/whatsapp
2. Sign up
3. Connect WhatsApp Business
4. Get API key

**Pros:** Good documentation, reliable
**Cons:** Requires business verification

---

## 3. 🏢 Google My Business API (Optional but Recommended)

### **Step 1: Claim Your Business on GMB**
1. Go to https://business.google.com/
2. Click **"Manage now"**
3. Search for your business or add new
4. Verify your business:
   - Postcard (5-7 days)
   - Phone call (instant)
   - Email (if available)

### **Step 2: Enable GMB API**
1. Go to https://console.cloud.google.com/
2. Use same project as Google Maps
3. Search **"Google My Business API"**
4. Click **"Enable"**

### **Step 3: Create OAuth 2.0 Credentials**
1. Go to **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Select **"Web application"**
4. Add authorized redirect URIs:
   - `https://yourdomain.com/api/gmb/callback`
   - `http://localhost:3000/api/gmb/callback`
5. Click **"Create"**
6. Copy **Client ID** and **Client Secret**

### **Step 4: Get Location ID**
1. Go to https://business.google.com/
2. Select your business
3. Click on **"Info"** tab
4. Copy the location ID from URL (looks like: `accounts/123.../locations/456...`)

### **Add to .env.local:**
```env
GMB_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMB_CLIENT_SECRET=your-client-secret
GMB_LOCATION_ID=accounts/123.../locations/456...
```

**Cost:** FREE (no limits for basic operations)

---

## 📝 **Complete .env.local Template**

Copy this to your `.env.local` file:

```env
# Supabase (Already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Maps API (for Route Optimization)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyC...your-key-here

# WhatsApp Business API
WHATSAPP_VERIFY_TOKEN=shashti_karz_verify_token
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxx
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345

# Google My Business API (Optional)
GMB_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMB_CLIENT_SECRET=your-client-secret
GMB_LOCATION_ID=accounts/123.../locations/456...
```

---

## ⏱️ **Time Required**

| Service | Setup Time | Approval Time | Total |
|---------|------------|---------------|-------|
| Google Maps | 10 minutes | Instant | **10 min** |
| WhatsApp (Meta) | 20 minutes | 1-2 days | **1-2 days** |
| WhatsApp (Twilio) | 15 minutes | Instant | **15 min** |
| Google My Business | 15 minutes | 5-7 days | **5-7 days** |

**Fastest Path:** 
1. ✅ Google Maps - 10 min (do now)
2. ✅ Twilio WhatsApp - 15 min (do now)
3. ⏳ GMB - Start verification (do now, wait 5-7 days)

---

## 💰 **Cost Summary**

| Service | Free Tier | After Free Tier |
|---------|-----------|-----------------|
| **Google Maps** | 28,000 loads/month | ₹5/1000 loads |
| **WhatsApp (Meta)** | 1,000 conversations/month | ₹0.50-₹1.50/conversation |
| **WhatsApp (Twilio)** | $15 credit | ₹0.50/message |
| **GMB API** | Unlimited | FREE |

**Monthly Cost Estimate (100 customers):**
- Google Maps: ₹0 (within free tier)
- WhatsApp: ₹0-₹150 (mostly free tier)
- GMB: ₹0 (always free)
- **Total: ₹0-₹150/month** 💰

---

## 🚀 **Quick Start (Do This Now)**

### **Priority 1: Google Maps (10 minutes)**
1. Create Google Cloud project
2. Enable Maps APIs
3. Create API key
4. Add to `.env.local`
✅ **Route optimization will work immediately!**

### **Priority 2: WhatsApp via Twilio (15 minutes)**
1. Sign up at Twilio
2. Get WhatsApp sandbox
3. Get API credentials
4. Add to `.env.local`
✅ **WhatsApp messaging works immediately!**

### **Priority 3: Start GMB Verification (5 minutes)**
1. Claim business on Google My Business
2. Request verification postcard
3. Wait 5-7 days
✅ **Set it and forget it!**

---

## 🆘 **Troubleshooting**

### **Google Maps API not working?**
- ✅ Check billing is enabled
- ✅ Verify APIs are enabled
- ✅ Check API key restrictions
- ✅ Wait 5 minutes for propagation

### **WhatsApp webhook not receiving messages?**
- ✅ Ensure URL is HTTPS (not HTTP)
- ✅ Verify token matches exactly
- ✅ Check webhook subscriptions
- ✅ Test with WhatsApp test number

### **GMB API errors?**
- ✅ Verify business is claimed
- ✅ Check OAuth credentials
- ✅ Ensure location ID is correct

---

## 📞 **Support Links**

- **Google Maps:** https://developers.google.com/maps/documentation
- **WhatsApp Business:** https://developers.facebook.com/docs/whatsapp
- **Twilio WhatsApp:** https://www.twilio.com/docs/whatsapp
- **Google My Business:** https://developers.google.com/my-business

---

## ✅ **Checklist**

- [ ] Google Cloud account created
- [ ] Google Maps API key obtained
- [ ] Billing enabled on Google Cloud
- [ ] WhatsApp Business account created
- [ ] WhatsApp API credentials obtained
- [ ] Webhook configured and verified
- [ ] GMB business claimed
- [ ] GMB verification started
- [ ] All keys added to `.env.local`
- [ ] Tested each API locally

---

**Once you have these keys, your platform will be 100% complete!** 🎉

**Start with Google Maps (10 min) - it's the easiest and most impactful!** 🚀
