// app/layout.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import AdminLink from "@/app/components/admin/admin-link";
import Navigation from "@/app/components/Navigation";
import { Providers } from "@/app/providers";
import "./globals.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/regelwerk.css";
import "./styles/spielergebnisse.css";
import "./styles/blechstatistik.css";

export const metadata: Metadata = {
  title: "Tuesday Selection Golf",
  description: "Tuesday Selection Golf - since April 2007",
  icons: {
    icon: [
      { url: '/images/tsg-logo.gif', type: 'image/gif' }
    ],
    shortcut: [
      { url: '/images/tsg-logo.gif', type: 'image/gif' }
    ],
    apple: [
      { url: '/images/tsg-logo.gif', type: 'image/gif' }
    ],
    other: [
      {
        rel: 'icon',
        url: '/images/tsg-logo.gif',
        type: 'image/gif',
        sizes: 'any'
      }
    ]
  },
  // Force browsers to refresh favicon on each page load
  other: {
    'cache-control': 'no-cache, no-store, must-revalidate',
    'pragma': 'no-cache',
    'expires': '0'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="modern-design">
      <body className="font-sans antialiased">
        <Providers>
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
                style={{ objectFit: 'contain' }}
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
        </Providers>
      </body>
    </html>
  );
}