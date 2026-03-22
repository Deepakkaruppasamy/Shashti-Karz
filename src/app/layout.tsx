import type { Metadata, Viewport } from "next";
import "./globals.css";

import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth-context";
import { SoundProvider } from "@/hooks/useSound";
import { LanguageProvider } from "@/lib/LanguageContext";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { PWARegistration } from "@/components/PWARegistration";
import { PWAInstallPrompt } from "@/components/pwa/InstallPrompt";

export const metadata: Metadata = {
  title: {
    default: "Shashti Karz - Premium Car Detailing Xpert | Tirupur",
    template: "%s | Shashti Karz"
  },
  description: "Elite car detailing services in Avinashi, Tirupur. Ceramic coating, Graphene coating, Paint Protection Film (PPF), and advanced Paint Correction. Experience BMW-standard care for your vehicle.",
  keywords: ["car detailing tirupur", "ceramic coating avinashi", "PPF tirupur", "paint correction tamil nadu", "premium car wash", "shashti karz detailing"],
  authors: [{ name: "Shashti Karz Team" }],
  creator: "Shashti Karz",
  publisher: "Shashti Karz",
  manifest: "/manifest.json",
  metadataBase: new URL("https://shashtikarz.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://shashtikarz.com",
    title: "Shashti Karz - Premium Car Detailing Xpert",
    description: "Tirupur's most advanced AI-powered car detailing center. Book premium ceramic coating and PPF online.",
    siteName: "Shashti Karz",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Shashti Karz - Experience Premium Detailing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shashti Karz - Premium Car Detailing",
    description: "Advanced detailing for luxury cars in Tirupur. Ceramic, PPF, and Paint Correction.",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Shashti Karz",
    startupImage: ["/logo.png"],
  },
  formatDetection: {
    telephone: true,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "AutoBodyShop",
              "name": "Shashti Karz",
              "image": "https://shashtikarz.com/logo.png",
              "@id": "https://shashtikarz.com",
              "url": "https://shashtikarz.com",
              "telephone": "+91 73583 03550",
              "priceRange": "₹₹₹",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Rajalakshmi Roofing Gundon Left Side 100 Meters",
                "addressLocality": "Tirupur",
                "addressRegion": "Tamil Nadu",
                "postalCode": "641654",
                "addressCountry": "IN"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 11.1085,
                "longitude": 77.3411
              },
              "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday"
                ],
                "opens": "09:00",
                "closes": "20:00"
              },
              "sameAs": [
                "https://facebook.com/shashtikarz",
                "https://instagram.com/shashtikarz"
              ]
            })
          }}
        />
      </head>
      <body className="antialiased bg-[#0a0a0a] text-white overflow-x-hidden" suppressHydrationWarning>
        <SoundProvider>
          <LanguageProvider>
            <AuthProvider>
              <PWARegistration />
              <PWAInstallPrompt />
              <main className="pb-16 lg:pb-0">
                {children}
              </main>
              <MobileBottomNav />
            </AuthProvider>
          </LanguageProvider>
        </SoundProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#111',
              border: '1px solid rgba(255,23,68,0.3)',
              color: '#fff'
            }
          }}
        />
      </body>
    </html>
  );
}
