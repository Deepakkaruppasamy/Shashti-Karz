import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Premium Car Detailing Services | Ceramic Coating & PPF",
  description: "Explore our elite car detailing services in Tirupur. Specialist in Ceramic Coating, Graphene Coating, and Paint Protection Film (PPF). View our detailed service catalog and pricing.",
  keywords: ["car detailing services tirupur", "ceramic coating price india", "PPF for cars price", "paint correction service", "graphene coating tirupur"],
  openGraph: {
    title: "Elite Car Detailing Services | Shashti Karz Tirupur",
    description: "Specialist car care: Ceramic Coating, PPF, and more. Certified experts using global premium products.",
    images: [{ url: "/og-services.png", width: 1200, height: 630, alt: "Shashti Karz Services" }],
  },
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
