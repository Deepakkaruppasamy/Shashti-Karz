import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book Online | Shashti Karz Car Detailing",
  description: "Schedule your premium car detailing, ceramic coating, or PPF service online. Easy booking and price estimation. Get your vehicle treatment today.",
  keywords: ["book car detailing online", "ceramic coating booking", "PPF price calculator", "car wash booking tirupur"],
  openGraph: {
    title: "Book Premium Detailing Now | Shashti Karz",
    description: "Fast and easy online booking for all detailing services. Estimate your price and schedule a service.",
  },
};

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
