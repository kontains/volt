
// layout.tsx

import type { Metadata } from "next";

import "@/src/app/globals.css";

import { ThemeProvider } from "@/src/components/ThemeProvider";

let title = "Volt";
let description = "Coding Agent";
let url = "https://gitub.com/kontains/volt";
let ogimage = "@/src/assets/vector.jpg";
let sitename = "kustomzone.com";

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title,
  description,
  icons: {
    icon: "@/src/assets/icon.ico",
  },
  openGraph: {
    images: [ogimage],
    title,
    description,
    url: url,
    siteName: sitename,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    images: [ogimage],
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </html>
  );
}
