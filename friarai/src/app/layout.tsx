import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FriarAI — Providence College Student Success',
  description: 'Your AI-powered student success companion at Providence College.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
