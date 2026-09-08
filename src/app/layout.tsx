import { Metadata } from "next";
import { Inter } from "next/font/google";
import { Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/ThemeProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { ChatWidgetClient } from "@/modules/chat/components/ChatWidgetClient";
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
  title: {
    default: "PadhaiShuru.com — GATE Preparation Platform",
    template: "%s | PadhaiShuru",
  },
  description:
    "Free GATE PYQ library, AI doubt engine, study tracker, mock tests, analytics, and mentorship — everything a GATE aspirant needs.",
  metadataBase: new URL("https://padhaishuru.com"),
  openGraph: {
    title: "PadhaiShuru.com — GATE Preparation Platform",
    description:
      "Free GATE PYQ library, AI doubt engine, study tracker, mock tests, analytics, and mentorship.",
    type: "website",
    url: "https://padhaishuru.com",
    siteName: "PadhaiShuru",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "PadhaiShuru — GATE Preparation, Reimagined",
      },
    ],
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "PadhaiShuru.com — GATE Preparation Platform",
    description:
      "Free GATE PYQ library, AI doubt engine, study tracker, mock tests, analytics, and mentorship.",
    images: ["/og-image.svg"],
  },
  icons: {
    icon: "/favicon.ico",
  },
  alternates: {
    canonical: "/",
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
           <ThemeProvider>
               <ErrorBoundary>
                 <Nav />
                 <ChatWidgetClient />
                 <ScrollReveal />
                 <main className="min-h-[calc(100vh-4rem)]">
                     {children}
                 </main>
                 <Footer />
                 <Analytics />
               </ErrorBoundary>
             </ThemeProvider>
          </body>
    </html>
  );
}
