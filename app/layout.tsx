import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Calendarium — Calendario Familiar",
  description: "Organizá y compartí los eventos de tu familia",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-slate-50 min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
