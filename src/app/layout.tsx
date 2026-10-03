import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { ThemeProvider } from "@/components/visa-check/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
});

const sora = Sora({
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "800"],
  variable: "--font-sora",
});

export const metadata: Metadata = {
  title: "VisaCheck — Global visa rule checker",
  description:
    "Free, private check against published visa rules across UK, US, Canada, Australia, Germany, UAE. Not immigration advice. Nothing stored.",
  applicationName: "VisaCheck",
  keywords: ["UK visa", "Skilled Worker visa", "visa check", "immigration rules", "private", "no tracking"],
  authors: [{ name: "VisaCheck" }],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VisaCheck",
  },
  openGraph: {
    title: "VisaCheck — UK visa rule checker",
    description:
      "Free, private check against published UK visa rules. Not immigration advice. Nothing stored.",
    type: "website",
    siteName: "VisaCheck",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f6f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0d9488" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Read the per-request nonce from middleware. Next.js 16 auto-applies it to its
  // own inline scripts when the nonce is in the request headers — and we also pass
  // it explicitly via <html nonce={...}> so React Server Components pick it up.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="en" suppressHydrationWarning nonce={nonce}>
      <head>
        {/* Manifest is wired via metadata above. iOS standalone metas: */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="VisaCheck" />
      </head>
      <body
        className={`${inter.variable} ${sora.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="vcTheme"
        >
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
          >
            Skip to content
          </a>
          {children}
          <Toaster richColors closeButton position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
