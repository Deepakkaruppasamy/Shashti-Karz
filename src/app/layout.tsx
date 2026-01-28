import type { Metadata } from "next";
import "./globals.css";

import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth-context";
import { SoundProvider } from "@/hooks/useSound";
import { LanguageProvider } from "@/lib/LanguageContext";

export const metadata: Metadata = {
  title: "Shashti Karz - Car Detailing Xpert | Tirupur",
  description: "Premium car detailing services in Avinashi, Tirupur. Ceramic coating, PPF, paint correction, and more. Experience BMW-level service.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="antialiased bg-[#0a0a0a] text-white" suppressHydrationWarning>
        <SoundProvider>
          <LanguageProvider>
            <AuthProvider>
              {children}
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
