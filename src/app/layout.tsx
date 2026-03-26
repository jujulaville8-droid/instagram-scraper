import type { Metadata } from "next";
import { JetBrains_Mono, DM_Sans } from "next/font/google";
import { Nav } from "@/components/nav";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "INSTALEAD // Target Acquisition",
  description: "Instagram lead finder for businesses needing websites",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${dmSans.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="flex h-full min-h-screen bg-[#07090d] font-[family-name:var(--font-dm-sans)] text-zinc-100">
        {/* Subtle grid overlay */}
        <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(16,185,129,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.4) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        {/* Radial glow from top-left */}
        <div className="pointer-events-none fixed -left-40 -top-40 z-0 h-[600px] w-[600px] rounded-full bg-emerald-500/[0.04] blur-[120px]" />
        <Nav />
        <main className="relative z-10 flex-1 p-4 pt-16 md:ml-[240px] md:p-10 md:pt-10">{children}</main>
      </body>
    </html>
  );
}
