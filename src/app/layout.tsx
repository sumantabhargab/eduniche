import { Metadata } from "next";
import { Inter } from "next/font/google";
import { Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/ThemeProvider";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
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
  title: "Eduneuro — Learn skills by doing, not just watching",
  description:
    "Eduneuro is an AI-powered, neuroscience-informed platform that helps you learn real-world skills through active practice, personalized feedback, and adaptive challenges.",
  openGraph: {
    title: "Eduneuro — Learn skills by doing",
    description:
      "An AI and neuroscience-informed platform for learning real skills through active practice and personalized feedback.",
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
           <ThemeProvider>
               <Nav />
               <ChatWidgetClient />
               <main className="min-h-[calc(100vh-4rem)]">
                   {children}
               </main>
               <Footer />
               <Analytics />
             </ThemeProvider>
          </body>
    </html>
  );
}
