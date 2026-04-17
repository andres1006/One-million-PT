import type { Metadata } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";

import { AppProviders } from "./providers";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const robotoSans = Roboto({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "OMC · Leads",
  description:
    "Panel de gestión de leads de One Million Copy SAS — prueba técnica frontend.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${robotoSans.variable} ${robotoMono.variable} h-full antialiased`}
    >
      <body className="relative min-h-full bg-background text-foreground">
        {/* Decorative gradient backdrop — purely cosmetic, pointer-events:none. */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 bg-app-backdrop"
        />
        <AppProviders>
          {children}
          <Toaster position="top-right" richColors />
        </AppProviders>
      </body>
    </html>
  );
}
