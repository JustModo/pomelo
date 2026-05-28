import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import Navbar from "@/components/global-navbar";
import { SessionProvider } from "@/components/session-provider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: {
    default: "Pomelo | Online Coding Contest & Assessment Platform",
    template: "%s | Pomelo",
  },
  description: "Pomelo is a lightweight, modern, self-hosted coding contest platform with real-time code execution, evaluation, and leaderboard statistics powered by Judge0 and Next.js.",
  keywords: [
    "coding contest",
    "programming competition",
    "online judge",
    "judge0",
    "next.js",
    "monaco editor",
    "hackathon platform",
    "pomelo",
    "competitive programming"
  ],
  authors: [{ name: "Pomelo Team" }],
  creator: "Pomelo Team",
  publisher: "Pomelo",
  metadataBase: new URL(process.env.NEXT_PUBLIC_CLIENT_URL || "http://localhost:3000"),
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_CLIENT_URL || "http://localhost:3000",
    title: "Pomelo | Online Coding Contest Platform",
    description: "Lightweight, modern coding contest platform with real-time code execution via Judge0.",
    siteName: "Pomelo",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pomelo | Online Coding Contest Platform",
    description: "Lightweight, modern coding contest platform with real-time code execution via Judge0.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider>
      <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
        <body className="antialiased">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Navbar />
            <Toaster position="top-center" expand />

            {children}
          </ThemeProvider>
        </body>
      </html>
    </SessionProvider>
  );
}
