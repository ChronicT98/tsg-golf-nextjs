// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import AdminLink from "@/app/components/admin/admin-link";
import Navigation from "@/app/components/Navigation";
import "./globals.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/members.css";
import "./styles/regelwerk.css";
import "./styles/spielergebnisse.css";
import "./styles/blechstatistik.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tuesday Selection Golf",
  description: "Tuesday Selection Golf - since April 2007",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="modern-design">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className="main-header">
          <div className="logo-container">
            <Link href="/">
              <Image
                src="/images/tsg-logo.gif"
                alt="Tuesday Selection Golf Logo"
                className="logo"
                width={100}
                height={100}
                priority
              />
            </Link>
            <div className="logo-text">Tuesday Selection Golf - since April 2007</div>
          </div>
        </header>

        <Navigation />

        <main>{children}</main>

        <footer className="main-footer">
          <div className="container">
            <p className="footer-copyright">
              &copy; {new Date().getFullYear()} Tuesday Selection Golf. Alle Rechte vorbehalten.
              <AdminLink />
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}