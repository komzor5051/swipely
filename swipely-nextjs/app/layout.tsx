import type { Metadata } from "next";
import { Outfit, Space_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
});

const spaceMono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Swipely — AI-генератор каруселей для Instagram",
  description:
    "Создавай вирусные карусели для Instagram за секунды с помощью AI. 16 дизайн-шаблонов, бесплатный старт.",
  openGraph: {
    title: "Swipely — AI-генератор каруселей для Instagram",
    description:
      "Отправь текст — получи готовую карусель для соцсетей. 16 шаблонов, бесплатный старт.",
    locale: "ru_RU",
    siteName: "Swipely",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${outfit.variable} ${spaceMono.variable} antialiased font-[family-name:var(--font-body)]`}
      >
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              borderRadius: "12px",
              fontSize: "14px",
            },
          }}
        />
      </body>
    </html>
  );
}
