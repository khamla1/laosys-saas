import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "LAOSYS | ລະບົບ POS ຮ້ານອາຫານ ແລະ ເວັບໄຊທ໌ E-Commerce ອັນດັບ 1 (#1 Smart POS)",
  description: "LAOSYS แพลตฟอร์มจัดการร้านอาหารและร้านค้าครบวงจร ระบบ POS ภาษาลาว-ไทย จัดการโต๊ะ สั่งอาหาร QR Code ดูสต๊อก และเปิดร้านออนไลน์ E-Commerce อันดับ 1 ในลาวและไทย",
  keywords: [
    "LAOSYS", "Laosys", "laosys", "laosys.site", "ระบบ POS", "ระบบ POS ร้านอาหาร",
    "POS ลาว", "POS ພາສາລາວ", "ລະບົບ POS", "ລະບົບຈັດການຮ້ານອາຫານ", "ระบบจัดการร้านอาหาร",
    "โปรแกรม POS", "โปรแกรมร้านอาหาร", "E-Commerce ลาว", "ขายของออนไลน์", "จัดการสต๊อก",
    "เว็บไซต์สำเร็จรูป", "POS ลาว-ไทย", "Smart POS Laos"
  ],
  authors: [{ name: "LAOSYS" }],
  metadataBase: new URL("https://laosys.site"),
  alternates: {
    canonical: "https://laosys.site",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico?v=2" },
      { url: "/icon.png?v=2", type: "image/png" },
      { url: "/logo-v2.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.ico?v=2"],
  },
  openGraph: {
    title: "LAOSYS - Smart POS & E-Commerce",
    description: "ແພລດຟອມຈັດການຮ້ານຄ້າຄົບວົງຈອນ ລະບົບ POS ແລະ ເວັບໄຊທ໌ E-Commerce",
    url: "https://laosys.site",
    siteName: "LAOSYS",
    locale: "lo_LA",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LAOSYS Cover Image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LAOSYS - Smart POS & E-Commerce",
    description: "ແພລດຟອມຈັດການຮ້ານຄ້າຄົບວົງຈອນ ລະບົບ POS ແລະ ເວັບໄຊທ໌ E-Commerce",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Structured Data (JSON-LD) for asserting brand identity across keyword variations
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "LAOSYS",
    "alternateName": ["Laosys", "laosys", "laosys.site"],
    "url": "https://laosys.site",
    "logo": "https://laosys.site/logo.png",
    "sameAs": [
      "https://www.facebook.com/share/1KBhGuvWsx/"
    ]
  };

  return (
    <html
      lang="lo"
      translate="no"
      suppressHydrationWarning
      style={{ fontFamily: "'Noto Sans Lao', sans-serif" }}
      className="h-full antialiased dark"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col font-sans overflow-x-hidden w-full bg-black">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
