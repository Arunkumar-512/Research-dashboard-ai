import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Analytics Canvas",
  description:
    "Modern AI-powered analytics dashboard for visualizing datasets, generating layouts, and exploring insights dynamically.",
  keywords: [
    "AI Dashboard",
    "Analytics",
    "Data Visualization",
    "Next.js",
    "Canvas AI",
    "Dashboard UI",
  ],
  authors: [{ name: "Your Name" }],
  creator: "Your Name",
  metadataBase: new URL("https://your-domain.com"),

  openGraph: {
    title: "AI Analytics Canvas",
    description:
      "Interactive AI analytics workspace with intelligent dashboard layouts and dataset visualization.",
    url: "https://your-domain.com",
    siteName: "AI Analytics Canvas",
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "AI Analytics Canvas",
    description:
      "Modern AI analytics platform built with Next.js and TailwindCSS.",
  },

  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`
        ${geistSans.variable}
        ${geistMono.variable}
        dark
        scroll-smooth
      `}
    >
      <body
        className="
          min-h-screen
          bg-[#f5f7fb]
          dark:bg-black
          text-zinc-900
          dark:text-zinc-100
          font-sans
          antialiased
          overflow-x-hidden
          selection:bg-indigo-500/30
          selection:text-white
        "
      >
        {/* GLOBAL BACKGROUND */}
        <div className="fixed inset-0 -z-50 overflow-hidden">
          
          {/* Gradient Mesh */}
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.12),transparent_30%)]" />

          {/* Grid Pattern */}
          <div
            className="
              absolute inset-0
              opacity-[0.03]
              dark:opacity-[0.05]
              bg-[linear-gradient(to_right,#ffffff22_1px,transparent_1px),linear-gradient(to_bottom,#ffffff22_1px,transparent_1px)]
              bg-[size:40px_40px]
            "
          />

          {/* Glow Effects */}
          <div className="absolute top-[-10%] left-[20%] h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute bottom-[-10%] right-[10%] h-[400px] w-[400px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        </div>

        {/* APP ROOT */}
        <div className="relative flex min-h-screen flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}