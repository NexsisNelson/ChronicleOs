import type { Metadata } from 'next'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'ChronicleOS Dashboard',
  description: 'Developer dashboard for inspecting AI agent memory and artifacts',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-slate-dark text-slate-200">
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
