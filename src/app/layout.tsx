import { Metadata } from "next";
import { Inter } from "next/font/google";
import { Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Eduniche — Learn the thinking behind the craft",
  description:
    "Structured learning from the people who actually live the craft, personalized by AI to how you learn. Starting with creators and experts from Assam and beyond.",
  openGraph: {
    title: "Eduniche — Learn the thinking behind the craft",
    description:
      "Structured learning from the people who actually live the craft, personalized by AI.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
