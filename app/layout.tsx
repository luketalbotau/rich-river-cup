import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import { GameProvider } from "@/components/GameProvider";
import { BottomNav, Header } from "@/components/Shell";
import { APP_NAME } from "@/lib/config";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const barlow = Barlow_Condensed({ subsets: ["latin"], weight: ["500", "600", "700", "800", "900"], style: ["normal", "italic"], variable: "--font-barlow" });

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Live draft, scores, odds and bets for the golf weekend",
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#06080c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${barlow.variable}`}>
      <body className="font-sans antialiased">
        <GameProvider>
          <Header />
          <main className="mx-auto max-w-md px-4 pb-[calc(88px+env(safe-area-inset-bottom))] pt-3">{children}</main>
          <BottomNav />
        </GameProvider>
      </body>
    </html>
  );
}
