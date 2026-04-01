import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fontOutfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const fontJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CRM Captação",
  description: "Acompanhamento e Gerenciamento de Leads",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${fontJakarta.variable} ${fontOutfit.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
        {children}
      </body>
    </html>
  );
}
