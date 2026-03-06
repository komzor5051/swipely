import type { Metadata, Viewport } from "next";
import { Outfit, Space_Mono } from "next/font/google";
import { Toaster } from "sonner";
import Script from "next/script";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Swipely — AI-генератор каруселей для соцсетей",
  description:
    "Создавай карусели для ВКонтакте, Instagram и Telegram за 30 секунд с помощью AI. 18 дизайн-шаблонов, бесплатный старт без карты.",
  keywords: [
    "генератор каруселей",
    "карусель для соцсетей",
    "карусель вконтакте",
    "карусель instagram",
    "карусель telegram",
    "ai карусель",
    "создать карусель онлайн",
    "генератор слайдов",
    "контент для соцсетей",
  ],
  openGraph: {
    title: "Swipely — AI-генератор каруселей для соцсетей",
    description:
      "Отправь текст — получи готовую карусель для ВКонтакте, Instagram или Telegram. 18 шаблонов, бесплатный старт.",
    locale: "ru_RU",
    siteName: "Swipely",
    type: "website",
    url: "https://swipely.ru",
  },
  // PWA / home-screen icon and name
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Swipely",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.svg",
  },
  other: {
    aurapay: "69958482b246d",
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

        {/* JSON-LD structured data — WebApplication + FAQPage + Organization */}
        <Script id="ld-json-app" type="application/ld+json" strategy="beforeInteractive">{`
          {"@context":"https://schema.org","@type":"WebApplication","@id":"https://swipely.ru/#app","name":"Swipely","url":"https://swipely.ru","description":"AI-генератор каруселей для ВКонтакте, Instagram и Telegram. Создайте профессиональные слайды из текста за 30 секунд.","applicationCategory":"DesignApplication","operatingSystem":"Web","inLanguage":"ru","featureList":["AI-генерация каруселей из текста","18 дизайн-шаблонов","Экспорт в PNG","Редактор слайдов","Поддержка ВКонтакте, Instagram, Telegram","Автоматические подписи к постам","Голосовой ввод"],"offers":{"@type":"Offer","price":"0","priceCurrency":"RUB","description":"Бесплатный план — 3 карусели в месяц без привязки карты"}}
        `}</Script>
        <Script id="ld-json-org" type="application/ld+json" strategy="beforeInteractive">{`
          {"@context":"https://schema.org","@type":"Organization","@id":"https://swipely.ru/#org","name":"Swipely","url":"https://swipely.ru","logo":"https://swipely.ru/icon.svg","sameAs":["https://t.me/swipelybot"]}
        `}</Script>
        <Script id="ld-json-faq" type="application/ld+json" strategy="beforeInteractive">{`
          {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Для каких социальных сетей подходит Swipely?","acceptedAnswer":{"@type":"Answer","text":"Swipely создаёт карусели для любых социальных сетей: ВКонтакте, Instagram, Telegram-каналы, LinkedIn и других платформ. Доступны два формата: квадратный 1080×1080 пикселей и вертикальный 1080×1350 пикселей."}},{"@type":"Question","name":"Что такое карусель в соцсетях?","acceptedAnswer":{"@type":"Answer","text":"Карусель в социальных сетях — это публикация из нескольких слайдов, которую пользователи листают горизонтально. Карусели получают в среднем в 3 раза больше охвата, чем обычные посты, потому что алгоритмы засчитывают каждое свайпание как взаимодействие."}},{"@type":"Question","name":"Как создать карусель для ВКонтакте с помощью AI?","acceptedAnswer":{"@type":"Answer","text":"Зайдите на swipely.ru, вставьте текст или тему поста, выберите шаблон и формат. AI сгенерирует карусель из 3–12 слайдов за 30 секунд. Скачайте PNG-файлы и загрузите их в запись ВКонтакте как фотоальбом."}},{"@type":"Question","name":"Сколько стоит создание карусели?","acceptedAnswer":{"@type":"Answer","text":"Бесплатный план включает 3 карусели в месяц без привязки карты. PRO-план — от 495 ₽/месяц с безлимитными каруселями, AI-генерацией с вашим фото и 18 шаблонами."}},{"@type":"Question","name":"Можно ли редактировать карусель после генерации?","acceptedAnswer":{"@type":"Answer","text":"Да. После генерации доступен встроенный редактор: можно изменить текст, цвет, шрифт, выравнивание и позицию элементов. Готовый результат экспортируется в PNG."}}]}
        `}</Script>

        {/* Yandex.Metrika */}
        <Script id="ym-init" strategy="afterInteractive">{`
          (function(m,e,t,r,i,k,a){
            m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
          })(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=106988360','ym');
          ym(106988360,'init',{ssr:true,webvisor:true,clickmap:true,ecommerce:"dataLayer",referrer:document.referrer,url:location.href,accurateTrackBounce:true,trackLinks:true});
        `}</Script>
        <noscript>
          <div>
            <img src="https://mc.yandex.ru/watch/106988360" style={{position:"absolute",left:"-9999px"}} alt="" />
          </div>
        </noscript>
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
