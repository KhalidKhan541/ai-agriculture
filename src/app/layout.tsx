import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "AgriAI - Smart Agriculture Platform",
    template: "%s | AgriAI",
  },
  description:
    "AI-powered agriculture platform for farm management, crop monitoring, yield prediction, and precision farming.",
  keywords: [
    "agriculture",
    "AI",
    "farming",
    "crop management",
    "precision agriculture",
    "yield prediction",
  ],
  authors: [{ name: "AgriAI Team" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#16a34a" },
    { media: "(prefers-color-scheme: dark)", color: "#15803d" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
