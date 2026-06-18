import type { Metadata } from 'next'
import { Space_Grotesk, Manrope, IBM_Plex_Mono } from 'next/font/google'
import '../styles/globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'ChronicleOS Control Room',
  description: 'Operational dashboard for inspecting ChronicleOS agent memory, artifacts, and workflows',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${manrope.variable} ${ibmPlexMono.variable} bg-slate-950 text-slate-100`}>
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
