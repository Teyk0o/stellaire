import { ViewTransition } from 'react'
import type { Metadata, Viewport } from 'next'
import { Source_Serif_4, Geist_Mono } from 'next/font/google'
import { ServiceWorkerRegistration } from '@/components/layout/ServiceWorkerRegistration'
import './globals.css'

const sourceSerif = Source_Serif_4({
  variable: '--font-source-serif',
  subsets: ['latin'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Stellaire',
  description: 'Cours interactifs de maths et physique-chimie',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Stellaire',
  },
  icons: {
    apple: '/web-app-manifest-192x192.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={`${sourceSerif.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex">
        <ViewTransition default="page-crossfade">
          {children}
        </ViewTransition>
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
}
