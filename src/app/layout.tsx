import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TopBar, BottomNav, SideNav } from "@/components/nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Box Scores — NBA",
  description: "A clean, fast NBA box score and stats app.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <TopBar />
        <div className="flex flex-1 w-full max-w-7xl mx-auto">
          <SideNav />
          <main className="flex-1 px-4 sm:px-6 pb-24 md:pb-10 pt-4 min-w-0">
            {children}
          </main>
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
