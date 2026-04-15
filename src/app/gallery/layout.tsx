import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Project Gallery | Shashti Karz Detailing Portfolio",
  description: "View our portfolio of premium car transformations. Real results of Ceramic Coating, PPF, and Paint Correction on luxury cars in Tirupur.",
  keywords: ["car detailing gallery", "ceramic coating results", "PPF before and after", "shashti karz portfolio"],
  alternates: {
    canonical: "/gallery",
  },
};

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
