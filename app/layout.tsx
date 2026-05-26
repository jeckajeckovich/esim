import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SimRoam — Travel Connectivity Intelligence",
  description: "Compare local SIMs, tourist eSIMs and prepaid plans for Serbia, Germany, Albania, Montenegro, Bosnia and North Macedonia.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}