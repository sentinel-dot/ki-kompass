import type { Metadata } from 'next'
import './globals.css'

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="noise">
        {children}
      </body>
    </html>
  )
}
