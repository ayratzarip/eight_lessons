import './globals.css';
import type { Metadata } from 'next';
import { Inter, Open_Sans } from 'next/font/google';
import Providers from './providers';

const inter = Inter({ 
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

const openSans = Open_Sans({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-opensans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'EightFaces: Soft Skills Engine',
  description: 'Платформа для развития социальных навыков',
  icons: {
    icon: '/assets/diamond_logo_green.png',
    apple: '/assets/diamond_logo_green.png',
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
        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "EightFaces: Soft Skills Engine",
            "description": "Платформа для развития социальных навыков",
            "url": "https://eightfaces.ru"
          }
        `}</script>
      </head>
      <body className={`${inter.variable} ${openSans.variable} font-sans`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}