import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Premium Detailing Services | Ceramic Coating & PPF Tirupur",
  description: "Explore Shashti Karz range of services: Ceramic Coating, Graphene Coating, Paint Protection Film (PPF), Interior Detailing, and Master Paint Correction.",
  keywords: ["ceramic coating tirupur", "PPF tamil nadu", "car wash avinashi", "best detailing services", "paint correction price"],
  alternates: {
    canonical: "/services",
  },
  openGraph: {
    title: "Premium Car Detailing Services | Shashti Karz",
    description: "Tirupur's most advanced car detailing treatments. Specialist in Ceramic, PPF, and Graphene coatings.",
    images: ["/services-og.png"],
  },
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
