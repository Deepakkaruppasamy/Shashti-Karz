import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fleet Management & Corporate Detailing | Shashti Karz",
  description: "Advanced vehicle fleet management and detailing services for corporate clients. Bulk booking, real-time tracking, and premium maintenance in Tirupur.",
  keywords: ["fleet detailing tirupur", "corporate car care", "business vehicle maintenance", "bulk car wash"],
  alternates: {
    canonical: "/fleet",
  },
};

export default function FleetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
