import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'ShowReady Artist Portal',
  description: 'Submit your show documents securely through your personal ShowReady portal.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen bg-gray-50 font-sans antialiased text-gray-900">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
