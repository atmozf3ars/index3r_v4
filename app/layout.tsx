'use client'
import './globals.css'
import { Inter } from 'next/font/google'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ThemeProvider } from '@/context/ThemeContext'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={inter.className}
        style={{
          '--background-animation-duration': 'var(--background-animation-duration, 10s)',
          '--page-transition-duration': 'var(--page-transition-duration, 0.3s)',
        }}
      >
        <NextThemesProvider attribute="class">
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </NextThemesProvider>
      </body>
    </html>
  )
}

