import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import OfflineIndicator from "@/components/OfflineIndicator";
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0E182D',
  colorScheme: 'light dark',
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "https://management-barang.vercel.app"),
  title: {
    default: "Management Barang",
    template: "%s | Management Barang"
  },
  description: "Sistem manajemen barang dengan QR Code. Organize barangmu sekarang. Kelola item, loker, dan tracking dengan mudah.",
  keywords: [
    "management barang",
    "inventory management", 
    "qr code",
    "asset tracking",
    "barang",
    "loker",
    "organization"
  ],
  authors: [{ name: "Management Barang Team" }],
  creator: "Management Barang",
  publisher: "Management Barang",
  robots: "index, follow",
  manifest: "/manifest.json",
  
  // Open Graph meta tags
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: process.env.NEXTAUTH_URL || "https://management-barang.vercel.app",
    siteName: "Management Barang",
    title: "Management Barang - Sistem Manajemen dengan QR Code",
    description: "Sistem manajemen barang dengan QR Code. Organize barangmu sekarang. Kelola item, loker, dan tracking dengan mudah.",
    images: [
      {
        url: "/og-images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Management Barang - Sistem Manajemen dengan QR Code",
      },
      {
        url: "/og-images/og-image-square.png",
        width: 600,
        height: 600,
        alt: "Management Barang",
      },
    ],
  },

  // Twitter Card meta tags
  twitter: {
    card: "summary_large_image",
    site: "@managementbarang",
    creator: "@managementbarang",
    title: "Management Barang - Sistem Manajemen dengan QR Code",
    description: "Sistem manajemen barang dengan QR Code. Organize barangmu sekarang.",
    images: [
      {
        url: "/twitter-images/twitter-image.png",
        width: 1200,
        height: 630,
        alt: "Management Barang",
      },
    ],
  },

  // Apple Web App meta tags
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BarangKU",
    startupImage: [
      // iPad Pro 12.9" (2048x2732)
      {
        url: "/splash/12.9__iPad_Pro_portrait.png",
        media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
      {
        url: "/splash/12.9__iPad_Pro_landscape.png",
        media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
      },
      
      // iPad Pro 11" (1668x2224)
      {
        url: "/splash/11__iPad_Pro__10.5__iPad_Pro_portrait.png", 
        media: "(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
      {
        url: "/splash/11__iPad_Pro__10.5__iPad_Pro_landscape.png",
        media: "(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
      },
      
      // iPad 10.2" (1536x2048)
      {
        url: "/splash/10.2__iPad_portrait.png",
        media: "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
      {
        url: "/splash/10.2__iPad_landscape.png",
        media: "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
      },
      
      // iPhone X/XS/11 Pro (1125x2436)
      {
        url: "/splash/iPhone_13_mini__iPhone_12_mini__iPhone_11_Pro__iPhone_XS__iPhone_X_portrait.png",
        media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/splash/iPhone_13_mini__iPhone_12_mini__iPhone_11_Pro__iPhone_XS__iPhone_X_landscape.png",
        media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
      },
      
      // iPhone 6+/7+/8+ (1242x2208)
      {
        url: "/splash/iPhone_8_Plus__iPhone_7_Plus__iPhone_6s_Plus__iPhone_6_Plus_portrait.png",
        media: "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/splash/iPhone_8_Plus__iPhone_7_Plus__iPhone_6s_Plus__iPhone_6_Plus_landscape.png",
        media: "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
      },
      
      // iPhone 6/7/8 (750x1334)
      {
        url: "/splash/iPhone_8__iPhone_7__iPhone_6s__iPhone_6__4.7__iPhone_SE_portrait.png",
        media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
      {
        url: "/splash/iPhone_8__iPhone_7__iPhone_6s__iPhone_6__4.7__iPhone_SE_landscape.png",
        media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
      },
      
      // iPhone 5/SE (640x1136)
      {
        url: "/splash/4__iPhone_SE__iPod_touch_5th_generation_and_later_portrait.png",
        media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
      {
        url: "/splash/4__iPhone_SE__iPod_touch_5th_generation_and_later_landscape.png",
        media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
      },
      
      // Modern iPhones
      // iPhone 14 Pro Max/15 Pro Max/16 Plus
      {
        url: "/splash/iPhone_16_Plus__iPhone_15_Pro_Max__iPhone_15_Plus__iPhone_14_Pro_Max_portrait.png",
        media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/splash/iPhone_16_Plus__iPhone_15_Pro_Max__iPhone_15_Plus__iPhone_14_Pro_Max_landscape.png",
        media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
      },
      
      // iPhone 14 Pro/15/16
      {
        url: "/splash/iPhone_16__iPhone_15_Pro__iPhone_15__iPhone_14_Pro_portrait.png",
        media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/splash/iPhone_16__iPhone_15_Pro__iPhone_15__iPhone_14_Pro_landscape.png",
        media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
      },
    ],
  },

  // Comprehensive icon configuration
  icons: {
    icon: [
      { url: "/favicons/favicon.ico", sizes: "any" },
      { url: "/favicons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-barangku-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-barangku-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicons/favicon.ico",
    apple: [
      { url: "/apple-touch-icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-touch-icons/apple-touch-icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/apple-touch-icons/apple-touch-icon-144x144.png", sizes: "144x144", type: "image/png" },
      { url: "/apple-touch-icons/apple-touch-icon-120x120.png", sizes: "120x120", type: "image/png" },
      { url: "/apple-touch-icons/apple-touch-icon-114x114.png", sizes: "114x114", type: "image/png" },
      { url: "/apple-touch-icons/apple-touch-icon-76x76.png", sizes: "76x76", type: "image/png" },
      { url: "/apple-touch-icons/apple-touch-icon-72x72.png", sizes: "72x72", type: "image/png" },
      { url: "/apple-touch-icons/apple-touch-icon-60x60.png", sizes: "60x60", type: "image/png" },
      { url: "/apple-touch-icons/apple-touch-icon-57x57.png", sizes: "57x57", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#0E182D",
      },
    ],
  },

  // Additional PWA and platform-specific meta tags
  other: {
    // Basic PWA support
    "mobile-web-app-capable": "yes",
    "application-name": "BarangKU",
    
    // Apple-specific
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "BarangKU",
    
    // Microsoft Tiles
    "msapplication-TileColor": "#0E182D",
    "msapplication-TileImage": "/icons/tile-150x150.png",
    "msapplication-config": "/browserconfig.xml",
    "msapplication-navbutton-color": "#0E182D",
    "msapplication-starturl": "/",
    "msapplication-square70x70logo": "/icons/tile-70x70.png",
    "msapplication-square150x150logo": "/icons/tile-150x150.png",
    "msapplication-wide310x150logo": "/icons/tile-310x150.png",
    "msapplication-square310x310logo": "/icons/tile-310x310.png",
    
    // Chrome/Android
    "theme-color": "#0E182D",
    "background-color": "#F8FAFC",
    
    // Additional Android/PWA
    "mobile-web-app-status-bar-style": "black-translucent",
    "full-screen": "yes",
    "browsermode": "application",
    
    // Security and performance
    "referrer": "strict-origin-when-cross-origin",
    "format-detection": "telephone=no",
    "HandheldFriendly": "true",
    "MobileOptimized": "width",
    
    // IE/Edge
    "msapplication-tap-highlight": "no",
    "msapplication-window": "width=1024;height=768",
    
    // PWA specific
    "pwa-elements": "true",
    "standalone": "true",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        {/* Additional Meta Tags */}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="google" content="notranslate" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BarangKU" />
        <meta name="application-name" content="BarangKU" />
        <meta name="msapplication-tooltip" content="Sistem Manajemen Barang dengan QR Code" />
        <meta name="msapplication-task" content="name=Home;action-uri=/;icon-uri=/favicons/favicon-32x32.png" />
        <meta name="msapplication-task" content="name=Scan QR;action-uri=/scan;icon-uri=/favicons/favicon-32x32.png" />
        <meta name="msapplication-task" content="name=Items;action-uri=/items;icon-uri=/favicons/favicon-32x32.png" />
        <meta name="msapplication-task" content="name=Lockers;action-uri=/lockers;icon-uri=/favicons/favicon-32x32.png" />
        
        {/* PWA Theme Colors for Different Modes */}
        <meta name="theme-color" content="#0E182D" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0E182D" media="(prefers-color-scheme: dark)" />
        
        {/* Additional Apple Meta Tags */}
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="apple-mobile-web-app-orientations" content="portrait" />
        
        {/* Android Chrome specific */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${inter.variable} antialiased font-sans`}
      >
        <Providers>
          <NavbarWrapper />
          <OfflineIndicator />
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#f1f5f9',
                border: '1px solid #334155',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '14px',
                fontWeight: '500',
              },
              success: {
                style: {
                  border: '1px solid #10b981',
                },
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#f1f5f9',
                },
              },
              error: {
                style: {
                  border: '1px solid #ef4444',
                },
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#f1f5f9',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}

function NavbarWrapper() {
  return <Navbar />;
}
