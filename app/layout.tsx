import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ADViora Leads Operations Dashboard',
  description: 'Internal private lead operations and multi-touch attribution viewer for ADViora Consulting.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
