import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'PS-promotion Artist Portal',
  description: 'Submit your show documents securely through your personal PS-promotion portal.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen antialiased">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  )
}
