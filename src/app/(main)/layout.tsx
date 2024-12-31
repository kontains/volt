
// layout.tsx

import "./globals.css";
import { Metadata } from "next";
import Image from "next/image";
import bgImg from "/assets/img/vector.jpg";
import Footer from "/components/Footer";
import Header from "/components/Header";

let title = "Volt";
let description = "Coding Agent";
let url = "http://localhost:8017"; // static port
let ogimage = "";
let sitename = "http://localhost:8017"; // static port

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title: 'Volt',
  description: 'Coding Agent',
  icons: {
    icon: "/assets/img/icon.ico",
  },
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
     <body className="bg-black">
      <div className="absolute inset-x-0 flex justify-center">
        <Image
          src={bgImg}
          alt=""
          className="w-full h-full mix-blend-screen"
          priority
        />
      </div>

      <div className="isolate">
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center py-2">
          <Header />
          {children}
          <Footer />
        </div>
      </div>
     </body>
    </html>
  );
}
