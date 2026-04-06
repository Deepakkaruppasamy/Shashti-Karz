import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Best Car Detailing in Tirupur",
  description: "Get in touch with Shashti Karz for the best car detailing in Tirupur. Phone, WhatsApp, and Address details available. Book your premium appointment today.",
  keywords: ["shashti karz contact", "car detailing tirupur location", "detailing shop near me tirupur", "best ceramic coating experts"],
  openGraph: {
    title: "Contact Shashti Karz | Premium Car Detailing",
    description: "Connect with Tirupur's elite detailing center. Location: Rajalakshmi Roofing Gundon Left Side, Tirupur.",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
