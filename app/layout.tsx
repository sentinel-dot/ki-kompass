import type { Metadata } from 'next'
import { Cormorant_Garamond, DM_Mono, DM_Sans } from 'next/font/google'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'KI-Kompass — KI-Nutzungsrichtlinie in 10 Minuten',
  description: 'Die maßgeschneiderte KI-Nutzungsrichtlinie für Ihr Unternehmen. DSGVO-konform, EU AI Act-ready, juristisch geprüft. Für KMUs im DACH-Raum.',
  keywords: ['KI-Richtlinie', 'EU AI Act', 'DSGVO', 'KI-Nutzungsrichtlinie', 'KMU', 'DACH'],
  openGraph: {
    title: 'KI-Kompass — KI-Nutzungsrichtlinie in 10 Minuten',
    description: 'Die maßgeschneiderte KI-Nutzungsrichtlinie für Ihr Unternehmen.',
    type: 'website',
    locale: 'de_DE',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body className={`${cormorant.variable} ${dmSans.variable} ${dmMono.variable} noise`}>
        {children}
      </body>
    </html>
  )
}
