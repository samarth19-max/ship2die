import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BF Rocket — Enter your offer once. Publish it without the mistakes.",
  description:
    "Enter your promotion once and get everything you need to publish it: a timezone-correct deal page, a share banner, launch copy that links to the right places, and a pre-flight review that catches the classic launch mistakes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
