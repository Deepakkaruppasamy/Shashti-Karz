import type { Metadata, Viewport } from "next";
import "./globals.css";

import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth-context";
import { SoundProvider } from "@/hooks/useSound";
import { LanguageProvider } from "@/lib/LanguageContext";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { PWARegistration } from "@/components/PWARegistration";
import { PWAInstallPrompt } from "@/components/pwa/InstallPrompt";
import { StructuredData } from "@/components/StructuredData";

export const metadata: Metadata = {
  title: {
    default: "Shashti Karz - Premium Car Detailing | Ceramic Coating & PPF Tirupur",
    template: "%s | Shashti Karz"
  },
  description: "Experience premium car detailing at Shashti Karz Tirupur. Specialist in Ceramic Coating, Graphene Coating, Paint Protection Film (PPF), and advanced Paint Correction in Tamil Nadu.",
  keywords: ["car detailing tirupur", "ceramic coating avinashi", "PPF tirupur", "paint correction tamil nadu", "premium car wash", "shashti karz detailing", "best car detailing in south india", "graphene coating tirupur"],
  authors: [{ name: "Shashti Karz Team" }],
  creator: "Shashti Karz",
  publisher: "Shashti Karz",
  manifest: "/manifest.json",
  metadataBase: new URL("https://shashtikarz.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://shashtikarz.app",
    title: "Shashti Karz - Premium Car Detailing Xpert | Tirupur",
    description: "Tirupur's most advanced car detailing center. Specialist in Ceramic Coating, PPF, and Graphene Coating. Book online for BMW-standard care.",
    siteName: "Shashti Karz",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Shashti Karz - Premium Detailing Showcase",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shashti Karz - Premium Car Detailing",
    description: "Advanced detailing for luxury cars in Tirupur. Ceramic, PPF, and Paint Correction. Rank #1 quality in Tamil Nadu.",
    images: ["/og-image.png"],
    creator: "@shashtikarz",
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
  icons: {
    icon: [
      { url: "/icon.png", sizes: "32x32" },
      { url: "/logo.png", sizes: "192x192" },
    ],
    apple: [
      { url: "/logo.png", sizes: "180x180" },
    ],
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
        <StructuredData />
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
