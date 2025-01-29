
// layout.tsx

import "@/src/app/(main)/globals.css";

import { Metadata } from "next";
import Image from "next/image";

import bgImg from "@/src/assets/img/vector.jpg";

import Footer from "@/src/components/Footer";
import Header from "@/src/components/Header";

import ThemeToggle from "@/src/components/ThemeToggle";

let title = "Volt";
let description = "Coding Agent";
let url = "http://localhost:3000"; // static port?
let sitename = "http://localhost:3000"; // static port?

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title: 'Volt',
  description: 'Coding Agent',
  icons: {
    icon: "@/src/assets/img/icon.ico",
  },
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
  <body>
    <div className="bg-black dark:bg-dark antialiased dark:text-gray-100 w-full h-full">
      <div className="absolute inset-x-0 flex justify-center">
        <Image
          src={bgImg}
          alt=""
          className="w-full max-w-[1200px] mix-blend-screen dark:mix-blend-plus-lighter dark:opacity-10"
          priority
        />
      </div>

      <div className="isolate relative">
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center py-2">
          <div className="fixed right-2 top-2 z-50">
            <ThemeToggle />
          </div>
          <Header />
          {children}
          <Footer />
        </div>
      </div>
    </div>
  </body>
  );
}
