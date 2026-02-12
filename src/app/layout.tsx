import type { Metadata, Viewport } from "next";
import "./globals.css";

import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth-context";
import { SoundProvider } from "@/hooks/useSound";
import { LanguageProvider } from "@/lib/LanguageContext";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { PWARegistration } from "@/components/PWARegistration";

export const metadata: Metadata = {
  title: "Shashti Karz - Car Detailing Xpert | Tirupur",
  description: "Premium car detailing services in Avinashi, Tirupur. Ceramic coating, PPF, paint correction, and more. Experience BMW-level service.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Shashti Karz",
    startupImage: [
      "/logo.png",
    ],
  },

  formatDetection: {
    telephone: true,
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
      <body className="antialiased bg-[#0a0a0a] text-white overflow-x-hidden" suppressHydrationWarning>
        <SoundProvider>
          <LanguageProvider>
            <AuthProvider>
              <PWARegistration />
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
