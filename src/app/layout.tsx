import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Henderson County Food Trucks | Find Food Trucks in Hendersonville, NC',
  description: 'Discover food trucks in Henderson County, NC. Find out where your favorite trucks are serving today at local breweries and events in Hendersonville, Mills River, and Flat Rock.',
  keywords: 'food trucks, Henderson County, Hendersonville, NC, North Carolina, food truck finder, breweries, local food',
  openGraph: {
    title: 'Henderson County Food Trucks',
    description: 'Find food trucks at local breweries and events in Henderson County, NC',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-stone-50">
        {children}
      </body>
    </html>
  )
}
