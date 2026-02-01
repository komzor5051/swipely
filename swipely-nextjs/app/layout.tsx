import type { Metadata } from "next";
import { DM_Serif_Display, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const outfit = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Swipely.ai - AI Генератор Каруселей для Instagram",
  description: "Создавай вирусные карусели для Instagram за секунды с помощью AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${dmSerifDisplay.variable} ${outfit.variable} ${jetbrainsMono.variable} antialiased font-body`}
      >
        {children}
      </body>
    </html>
  );
}
