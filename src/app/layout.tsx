import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"

export const metadata: Metadata = {
  title: "✨ Mary-Ann's 21st ✨",
  description: "You're invited. RSVP before Wednesday.",
  openGraph: {
    title: "✨ Mary-Ann's 21st ✨",
    description: "You're invited. RSVP before Wednesday.",
    url: "https://mary-ann-turns-up.vercel.app",
    siteName: "Mary-Ann's 21st",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "✨ Mary-Ann's 21st ✨",
    description: "You're invited. RSVP before Wednesday.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
