import type { Metadata } from 'next';
import { Fredoka, Source_Sans_3 } from 'next/font/google';
import './globals.css';

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display',
});

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: "What's Rollin' Local | Food Trucks in WNC",
  description: 'Your guide to food trucks, breweries & events in Western North Carolina. Find where your favorite food trucks are serving today.',
  openGraph: {
    title: "What's Rollin' Local",
    description: 'Your NEW source for finding food trucks, breweries and events in Hendersonville, Mills River, Etowah and beyond!',
    url: 'https://whatsrollinlocal.com',
    siteName: "What's Rollin' Local",
    images: [
      {
        url: 'https://whatsrollinlocal.com/images/og-image.png',
        width: 1200,
        height: 630,
        alt: "What's Rollin' Local - Find food trucks in WNC",
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "What's Rollin' Local",
    description: 'Your guide to food trucks, breweries & events in WNC',
    images: ['https://whatsrollinlocal.com/images/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fredoka.variable} ${sourceSans.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
