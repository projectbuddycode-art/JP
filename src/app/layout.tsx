import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Newsreader } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "Northridge — Himalayan journeys",
    template: "%s · Northridge",
  },
  description:
    "Thoughtfully planned journeys through Spiti Valley, Manali, and Ladakh. Enquire with the travel desk. Viewing a page does not confirm a booking.",
  keywords: [
    "Spiti Valley tour",
    "Ladakh road trip",
    "Manali holiday",
    "Himalayan travel",
    "Northridge",
    "custom Himalayan itinerary",
  ],
  verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION }
    : undefined,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${newsreader.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
