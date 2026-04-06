# Shashti Karz SEO Optimization & Implementation

This implementation optimizes https://shashtikarz.app for Google Search using industry-leading practices for local businesses.

## 1. Next.js Implementation Details

### A. Root Layout (`src/app/layout.tsx`)
The global metadata has been updated to include correct keywords, descriptions, and Open Graph tags for social media previews.

```tsx
export const metadata: Metadata = {
  title: {
    default: "Shashti Karz - Premium Car Detailing | Ceramic Coating & PPF Tirupur",
    template: "%s | Shashti Karz"
  },
  description: "Experience premium car detailing at Shashti Karz Tirupur. Specialist in Ceramic Coating, Graphene Coating, Paint Protection Film (PPF), and advanced Paint Correction in Tamil Nadu.",
  keywords: ["car detailing tirupur", "ceramic coating avinashi", "PPF tirupur", "paint correction tamil nadu", "premium car wash", "shashti karz detailing", "best car detailing in south india", "graphene coating tirupur"],
  // ... more tags
};
```

### B. Route-Specific Metadata
Added dedicated layouts for Services, Contact, and Booking to ensure targeted keywords rank for specific searches.
- `src/app/services/layout.tsx`
- `src/app/contact/layout.tsx`
- `src/app/booking/layout.tsx`

### C. Structured Data (JSON-LD)
A comprehensive `StructuredData` component has been created at `src/components/StructuredData.tsx`. It includes:
- **LocalBusiness**: Tells Google your location, price range, and business hours.
- **Organization**: Establishes brand identity.
- **AggregateRating**: Displays star ratings in search results (if reviews exist).
- **FAQPage**: Expands your search result real estate with collapsible questions.

---

## 2. Plain HTML Version (for fallback or reference)

If you were using plain HTML, here is how the header should look:

```html
<!-- SEO Meta Tags -->
<title>Shashti Karz - Premium Car Detailing | Ceramic Coating & PPF Tirupur</title>
<meta name="description" content="Experience premium car detailing at Shashti Karz Tirupur. Specialist in Ceramic Coating, Graphene Coating, PPF, and advanced Paint Correction.">
<meta name="keywords" content="car detailing tirupur, ceramic coating avinashi, PPF tirupur, paint correction tamil nadu, premium car wash">
<link rel="canonical" href="https://shashtikarz.app/">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://shashtikarz.app/">
<meta property="og:title" content="Shashti Karz - Premium Car Detailing Xpert | Tirupur">
<meta property="og:description" content="Tirupur's most advanced car detailing center. Specialist in Ceramic Coating, PPF, and Graphene Coating.">
<meta property="og:image" content="https://shashtikarz.app/og-image.png">

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="https://shashtikarz.app/">
<meta property="twitter:title" content="Shashti Karz - Premium Car Detailing">
<meta property="twitter:description" content="Advanced detailing for luxury cars in Tirupur. Ceramic, PPF, and Paint Correction.">
<meta property="twitter:image" content="https://shashtikarz.app/og-image.png">

<!-- Favicons -->
<link rel="icon" type="image/png" href="/icon.png">
<link rel="apple-touch-icon" href="/logo.png">

<!-- JSON-LD Structured Data -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "name": "Shashti Karz",
      "url": "https://shashtikarz.app",
      "telephone": "+91 73583 03550",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Rajalakshmi Roofing Gundon Left Side 100 Meters",
        "addressLocality": "Tirupur",
        "addressRegion": "Tamil Nadu",
        "postalCode": "641654",
        "addressCountry": "IN"
      }
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What services does Shashti Karz offer?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Shashti Karz offers Ceramic Coating, Graphene Coating, Paint Protection Film (PPF), and advanced Detailing."
          }
        }
      ]
    }
  ]
}
</script>
```

---

## 3. Sitemap & Robots

### Sitemap.xml (`src/app/sitemap.ts`)
Already configured to include all major pages with appropriate priorities.

### Robots.txt (`public/robots.txt`)
Updated to allow full crawling while hiding sensitive admin/api routes.

---

## 4. Ranking #1 Locally - Pro Tips

To dominate search results in **Tirupur** and **Avinashi**, follow these steps:

1.  **Google Business Profile (GBP)**:
    *   Claim your profile if you haven't.
    *   Ensure the name matches "Shashti Karz" exactly.
    *   **CRITICAL**: Get at least 20+ reviews with photos. Reply to every review mentioning keywords like "ceramic coating in Tirupur".
2.  **Local Keywords in Content**:
    *   Add a "Service Areas" section in the footer: "Serving Tirupur, Avinashi, Palladam, and Kangeyam".
    *   Blog about projects: "Tesla Ceramic Coating Project in Tirupur" - this creates deep local relevance.
3.  **Image Optimization**:
    *   Name your images `ceramic-coating-tirupur.jpg` rather than `IMG_001.jpg`.
    *   Add ALT text to every image.
4.  **Backlinks**:
    *   Get listed on local directories (Justdial, Sulekha, Yellow Pages).
    *   Submit your site to Google Search Console and request indexing for the homepage.
5.  **Internal Linking**:
    *   Link to `/services` from the homepage using text like "Our Premium Car Detailing Services in Tirupur".

---

## 5. Performance Improvements
*   **Image Compression**: Use `.webp` format for all gallery images to improve LCP (Largest Contentful Paint).
*   **Edge Caching**: Since you use Next.js, ensure you are using a CDN like Vercel or AWS CloudFront to serve data from the nearest node.
