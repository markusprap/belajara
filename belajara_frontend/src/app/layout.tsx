import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Belajara | Platform Pembelajaran AI",
  description: "Platform Pembelajaran Interaktif Berbasis AI dengan Sistem Rekomendasi Mata Kuliah",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <Script src="https://accounts.google.com/gsi/client" strategy="beforeInteractive" />
        <ThemeProvider defaultTheme="light" storageKey="belajara-ui-theme">
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
