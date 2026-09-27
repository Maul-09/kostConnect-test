import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { RoleProvider } from "@/context/RoleContext";
import { FeedbackProvider } from "@/context/FeedbackContext";
import { NotificationProvider } from "@/context/NotificationContext";

export const metadata: Metadata = {
  title: "KosConnect ERP • Sistem Manajemen Sewa Kos & Properti",
  description: "Platform mini ERP sewa kos dengan integrasi Payment Gateway Midtrans Snap dan otomasi alur kerja n8n",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
    >
      <body className="min-h-full flex flex-col">
        <FeedbackProvider>
          <NotificationProvider>
            <RoleProvider>
              {children}
            </RoleProvider>
          </NotificationProvider>
        </FeedbackProvider>
      </body>
    </html>
  );
}

