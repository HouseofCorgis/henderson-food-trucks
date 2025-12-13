import type { Metadata } from 'next';
import { Fredoka, Source_Sans_3 } from 'next/font/google';
import Script from 'next/script';
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fredoka.variable} ${sourceSans.variable}`}>
      <body className="font-body antialiased">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-0K2GGWHLY2"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-0K2GGWHLY2');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
